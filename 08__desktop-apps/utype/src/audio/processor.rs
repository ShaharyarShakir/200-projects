use audioadapter_buffers::direct::InterleavedSlice;
use rubato::{
    Async, FixedAsync, Resampler, SincInterpolationParameters, SincInterpolationType,
    WindowFunction,
};

use super::format::{AudioSpec, SampleFormat, convert_bytes_to_f32, downmix_to_mono};

const SINC_LEN: usize = 64;
const SINC_OVERSAMPLING: usize = 32;
const SINC_CUTOFF: f32 = 0.95;

pub struct AudioProcessor {
    native: AudioSpec,
    target_rate: u32,
    resampler: Async<f32>,
    mono_pending: Vec<f32>,
    f32_scratch: Vec<f32>,
    mono_scratch: Vec<f32>,
    out_scratch: Vec<f32>,
}

impl AudioProcessor {
    pub fn new(native: AudioSpec, target_rate: u32, chunk_frames: usize) -> anyhow::Result<Self> {
        let ratio = target_rate as f64 / native.sample_rate as f64;
        if ratio <= 0.0 {
            anyhow::bail!(
                "invalid resample ratio {ratio} (target {target_rate}, native {})",
                native.sample_rate
            );
        }
        let params = SincInterpolationParameters {
            sinc_len: SINC_LEN,
            f_cutoff: Some(SINC_CUTOFF),
            oversampling_factor: SINC_OVERSAMPLING,
            interpolation: SincInterpolationType::Cubic,
            window: WindowFunction::BlackmanHarris2,
        };
        let resampler =
            Async::<f32>::new_sinc(ratio, 1.0, &params, chunk_frames, 1, FixedAsync::Input)
                .map_err(|err| anyhow::anyhow!("failed to create resampler: {err}"))?;
        let output_max = resampler.output_frames_max();
        Ok(AudioProcessor {
            native,
            target_rate,
            resampler,
            mono_pending: Vec::with_capacity(chunk_frames),
            f32_scratch: Vec::new(),
            mono_scratch: Vec::new(),
            out_scratch: vec![0.0; output_max],
        })
    }

    pub fn target_spec(&self) -> AudioSpec {
        AudioSpec {
            sample_rate: self.target_rate,
            channels: 1,
            format: SampleFormat::F32,
        }
    }

    pub fn process(&mut self, raw: &[u8]) -> anyhow::Result<Vec<f32>> {
        self.f32_scratch.clear();
        convert_bytes_to_f32(self.native.format, raw, &mut self.f32_scratch);

        self.mono_scratch.clear();
        downmix_to_mono(
            self.native.channels,
            &self.f32_scratch,
            &mut self.mono_scratch,
        );
        self.mono_pending.extend_from_slice(&self.mono_scratch);

        let mut out = Vec::new();
        let mut consumed = 0;
        let input_frames = self.resampler.input_frames_next();
        while self.mono_pending.len() >= consumed + input_frames {
            let chunk = &self.mono_pending[consumed..consumed + input_frames];
            let in_adapter = InterleavedSlice::new(chunk, 1, input_frames)
                .map_err(|err| anyhow::anyhow!("failed to wrap input for resampler: {err}"))?;
            let output_capacity = self.out_scratch.len();
            let mut out_adapter =
                InterleavedSlice::new_mut(&mut self.out_scratch, 1, output_capacity)
                    .map_err(|err| anyhow::anyhow!("failed to wrap output for resampler: {err}"))?;
            let (_input_used, output_frames) = self
                .resampler
                .process_into_buffer(&in_adapter, &mut out_adapter, None)
                .map_err(|err| anyhow::anyhow!("resampling failed: {err}"))?;
            out.extend_from_slice(&self.out_scratch[..output_frames]);
            consumed += input_frames;
        }
        if consumed > 0 {
            self.mono_pending.drain(..consumed);
        }
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_processor(native_rate: u32, channels: u16) -> AudioProcessor {
        AudioProcessor::new(
            AudioSpec {
                sample_rate: native_rate,
                channels,
                format: SampleFormat::F32,
            },
            16_000,
            native_rate as usize / 100,
        )
        .unwrap()
    }

    #[test]
    fn resamples_48k_mono_to_16k() {
        let native_rate = 48_000;
        let mut processor = make_processor(native_rate, 1);
        let duration_frames = native_rate as usize;
        let mut tone = Vec::with_capacity(duration_frames);
        for i in 0..duration_frames {
            let t = i as f32 / native_rate as f32;
            tone.push((std::f32::consts::TAU * 440.0 * t).sin());
        }
        let raw: Vec<u8> = tone
            .iter()
            .flat_map(|sample| sample.to_ne_bytes())
            .collect();
        let mut total: usize = 0;
        for chunk in raw.chunks(4800) {
            total += processor.process(chunk).unwrap().len();
        }
        let expected = duration_frames / 3;
        let tolerance = expected / 50;
        assert!(
            (total as i64 - expected as i64).unsigned_abs() < tolerance as u64,
            "output length {total} far from expected {expected}"
        );
    }

    #[test]
    fn resamples_44_1k_stereo_to_16k() {
        let native_rate = 44_100;
        let mut processor = make_processor(native_rate, 2);
        let frames = native_rate as usize;
        let mut interleaved = Vec::with_capacity(frames * 2);
        for i in 0..frames {
            let t = i as f32 / native_rate as f32;
            let sample = (std::f32::consts::TAU * 330.0 * t).sin();
            interleaved.push(sample);
            interleaved.push(sample);
        }
        let raw: Vec<u8> = interleaved
            .iter()
            .flat_map(|sample| sample.to_ne_bytes())
            .collect();
        let mut total: usize = 0;
        for chunk in raw.chunks(4410 * 2 * 4) {
            total += processor.process(chunk).unwrap().len();
        }
        let expected = (frames as f64 * 16_000.0 / native_rate as f64) as usize;
        let tolerance = expected / 50;
        assert!(
            (total as i64 - expected as i64).unsigned_abs() < tolerance as u64,
            "output length {total} far from expected {expected}"
        );
    }

    #[test]
    fn quiet_audio_is_not_discarded() {
        let native_rate = 48_000;
        let mut processor = make_processor(native_rate, 1);
        let quiet_sample = 0.001_f32;
        let raw: Vec<u8> = (0..native_rate as usize)
            .flat_map(|_| quiet_sample.to_ne_bytes())
            .collect();
        let mut peak = 0.0f32;
        for chunk in raw.chunks(4800) {
            let out = processor.process(chunk).unwrap();
            peak = peak.max(out.iter().fold(0.0f32, |acc, s| acc.max(s.abs())));
        }
        assert!(peak > 0.0, "quiet audio must survive processing");
    }
}
