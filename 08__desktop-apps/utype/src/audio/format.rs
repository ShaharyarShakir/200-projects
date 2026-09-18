use crate::error::UtError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SampleFormat {
    F32,
    F64,
    I8,
    I16,
    I32,
    I64,
    U8,
    U16,
    U32,
    U64,
}

impl SampleFormat {
    pub fn bytes_per_sample(&self) -> usize {
        match self {
            SampleFormat::F32 | SampleFormat::I32 | SampleFormat::U32 => 4,
            SampleFormat::F64 | SampleFormat::I64 | SampleFormat::U64 => 8,
            SampleFormat::I16 | SampleFormat::U16 => 2,
            SampleFormat::I8 | SampleFormat::U8 => 1,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            SampleFormat::F32 => "f32",
            SampleFormat::F64 => "f64",
            SampleFormat::I8 => "i8",
            SampleFormat::I16 => "i16",
            SampleFormat::I32 => "i32",
            SampleFormat::I64 => "i64",
            SampleFormat::U8 => "u8",
            SampleFormat::U16 => "u16",
            SampleFormat::U32 => "u32",
            SampleFormat::U64 => "u64",
        }
    }
}

impl TryFrom<cpal::SampleFormat> for SampleFormat {
    type Error = UtError;

    fn try_from(value: cpal::SampleFormat) -> Result<Self, Self::Error> {
        use cpal::SampleFormat as Cpal;
        match value {
            Cpal::F32 => Ok(SampleFormat::F32),
            Cpal::F64 => Ok(SampleFormat::F64),
            Cpal::I8 => Ok(SampleFormat::I8),
            Cpal::I16 => Ok(SampleFormat::I16),
            Cpal::I32 => Ok(SampleFormat::I32),
            Cpal::I64 => Ok(SampleFormat::I64),
            Cpal::U8 => Ok(SampleFormat::U8),
            Cpal::U16 => Ok(SampleFormat::U16),
            Cpal::U32 => Ok(SampleFormat::U32),
            Cpal::U64 => Ok(SampleFormat::U64),
            other => Err(UtError::UnsupportedFormat(format!("{other:?}"))),
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct AudioSpec {
    pub sample_rate: u32,
    pub channels: u16,
    pub format: SampleFormat,
}

pub fn convert_bytes_to_f32(format: SampleFormat, src: &[u8], dst: &mut Vec<f32>) {
    match format {
        SampleFormat::F32 => {
            dst.reserve(src.len() / 4);
            for chunk in src.as_chunks::<4>().0 {
                dst.push(f32::from_ne_bytes(*chunk));
            }
        }
        SampleFormat::F64 => {
            for chunk in src.as_chunks::<8>().0 {
                dst.push(f64::from_ne_bytes(*chunk) as f32);
            }
        }
        SampleFormat::I8 => {
            for &sample in src {
                dst.push((sample as f32 / i8::MAX as f32).clamp(-1.0, 1.0));
            }
        }
        SampleFormat::U8 => {
            for &sample in src {
                dst.push(((sample as f32 / u8::MAX as f32) * 2.0 - 1.0).clamp(-1.0, 1.0));
            }
        }
        SampleFormat::I16 => {
            for chunk in src.as_chunks::<2>().0 {
                dst.push((i16::from_ne_bytes(*chunk) as f32 / i16::MAX as f32).clamp(-1.0, 1.0));
            }
        }
        SampleFormat::U16 => {
            for chunk in src.as_chunks::<2>().0 {
                dst.push(
                    ((u16::from_ne_bytes(*chunk) as f32 / u16::MAX as f32) * 2.0 - 1.0)
                        .clamp(-1.0, 1.0),
                );
            }
        }
        SampleFormat::I32 => {
            for chunk in src.as_chunks::<4>().0 {
                let sample = i32::from_ne_bytes(*chunk) as f64 / i32::MAX as f64;
                dst.push((sample as f32).clamp(-1.0, 1.0));
            }
        }
        SampleFormat::U32 => {
            for chunk in src.as_chunks::<4>().0 {
                let sample = u32::from_ne_bytes(*chunk) as f64 / u32::MAX as f64 * 2.0 - 1.0;
                dst.push((sample as f32).clamp(-1.0, 1.0));
            }
        }
        SampleFormat::I64 => {
            for chunk in src.as_chunks::<8>().0 {
                let sample = i64::from_ne_bytes(*chunk) as f64 / i64::MAX as f64;
                dst.push((sample as f32).clamp(-1.0, 1.0));
            }
        }
        SampleFormat::U64 => {
            for chunk in src.as_chunks::<8>().0 {
                let sample = u64::from_ne_bytes(*chunk) as f64 / u64::MAX as f64 * 2.0 - 1.0;
                dst.push((sample as f32).clamp(-1.0, 1.0));
            }
        }
    }
}

pub fn downmix_to_mono(channels: u16, src: &[f32], dst: &mut Vec<f32>) {
    if channels <= 1 {
        dst.extend_from_slice(src);
        return;
    }
    let channels = channels as usize;
    dst.reserve(src.len() / channels);
    for frame in src.chunks_exact(channels) {
        let sum: f32 = frame.iter().sum();
        dst.push(sum / channels as f32);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_i16_to_f32() {
        let samples: [i16; 4] = [0, i16::MAX, i16::MIN, 16384];
        let bytes: Vec<u8> = samples
            .iter()
            .flat_map(|sample| sample.to_ne_bytes())
            .collect();
        let mut out = Vec::new();
        convert_bytes_to_f32(SampleFormat::I16, &bytes, &mut out);
        assert_eq!(out.len(), 4);
        assert_eq!(out[0], 0.0);
        assert!((out[1] - 1.0).abs() < 1e-6);
        assert!((out[2] - -1.0).abs() < 1e-6);
        assert!((out[3] - (16384.0 / i16::MAX as f32)).abs() < 1e-6);
    }

    #[test]
    fn converts_u16_to_f32() {
        let samples: [u16; 3] = [0, u16::MAX, u16::MAX / 4];
        let bytes: Vec<u8> = samples
            .iter()
            .flat_map(|sample| sample.to_ne_bytes())
            .collect();
        let mut out = Vec::new();
        convert_bytes_to_f32(SampleFormat::U16, &bytes, &mut out);
        assert_eq!(out.len(), 3);
        assert!((out[0] - -1.0).abs() < 1e-6);
        assert!((out[1] - 1.0).abs() < 1e-6);
        assert!((out[2] - -0.5).abs() < 1e-3);
    }

    #[test]
    fn converts_f32_passthrough() {
        let samples: [f32; 3] = [0.5, -0.25, 0.0];
        let bytes: Vec<u8> = samples
            .iter()
            .flat_map(|sample| sample.to_ne_bytes())
            .collect();
        let mut out = Vec::new();
        convert_bytes_to_f32(SampleFormat::F32, &bytes, &mut out);
        assert_eq!(out, vec![0.5, -0.25, 0.0]);
    }

    #[test]
    fn downmix_averages_channels() {
        let src = vec![1.0, 3.0, -1.0, 1.0, 0.5, 0.5];
        let mut out = Vec::new();
        downmix_to_mono(2, &src, &mut out);
        assert_eq!(out, vec![2.0, 0.0, 0.5]);
    }

    #[test]
    fn downmix_passthrough_mono() {
        let src = vec![0.1, 0.2, 0.3];
        let mut out = Vec::new();
        downmix_to_mono(1, &src, &mut out);
        assert_eq!(out, vec![0.1, 0.2, 0.3]);
    }
}
