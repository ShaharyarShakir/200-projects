use std::collections::VecDeque;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Condvar, Mutex};
use std::time::{Duration, Instant};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use super::format::{AudioSpec, SampleFormat};
use crate::error::UtError;

pub struct RawChunk {
    pub bytes: Vec<u8>,
    pub captured_at: Instant,
}

pub struct RawAudioQueue {
    inner: Mutex<RawAudioQueueInner>,
    signal: Condvar,
    capacity: usize,
    dropped: Arc<AtomicU64>,
}

struct RawAudioQueueInner {
    queue: VecDeque<RawChunk>,
    closed: bool,
}

impl RawAudioQueue {
    pub fn new(capacity: usize, dropped: Arc<AtomicU64>) -> Self {
        RawAudioQueue {
            inner: Mutex::new(RawAudioQueueInner {
                queue: VecDeque::with_capacity(capacity),
                closed: false,
            }),
            signal: Condvar::new(),
            capacity,
            dropped,
        }
    }

    pub fn push(&self, chunk: RawChunk) {
        let mut guard = match self.inner.lock() {
            Ok(guard) => guard,
            Err(err) => {
                self.dropped.fetch_add(1, Ordering::Relaxed);
                log::warn!("raw audio queue mutex poisoned: {err}");
                return;
            }
        };
        if guard.queue.len() == self.capacity {
            guard.queue.pop_front();
            self.dropped.fetch_add(1, Ordering::Relaxed);
        }
        guard.queue.push_back(chunk);
        self.signal.notify_one();
    }

    pub fn pop(&self) -> Option<RawChunk> {
        let mut guard = match self.inner.lock() {
            Ok(guard) => guard,
            Err(err) => {
                log::error!("raw audio queue mutex poisoned: {err}");
                return None;
            }
        };
        loop {
            if let Some(chunk) = guard.queue.pop_front() {
                return Some(chunk);
            }
            if guard.closed {
                return None;
            }
            guard = match self.signal.wait(guard) {
                Ok(guard) => guard,
                Err(err) => {
                    log::error!("raw audio queue condvar poisoned: {err}");
                    return None;
                }
            };
        }
    }

    pub fn close(&self) {
        let mut guard = self.inner.lock().unwrap();
        guard.closed = true;
        self.signal.notify_all();
    }
}

pub struct CaptureInfo {
    pub device_name: String,
    pub spec: AudioSpec,
}

pub struct AudioCapture {
    stream: cpal::Stream,
    pub info: CaptureInfo,
}

impl AudioCapture {
    pub fn open(
        requested_device: Option<&str>,
        queue: Arc<RawAudioQueue>,
        chunk_ms: u64,
    ) -> anyhow::Result<Self> {
        let host = cpal::default_host();
        let device = match requested_device {
            Some(name) => {
                let mut devices = host.input_devices().map_err(|err| {
                    UtError::Audio(format!("failed to enumerate input devices: {err}"))
                })?;
                devices
                    .find(|candidate| {
                        candidate
                            .description()
                            .map(|description| description.name() == name)
                            .unwrap_or(false)
                    })
                    .ok_or_else(|| UtError::Audio(format!("no input device named '{name}'")))?
            }
            None => host
                .default_input_device()
                .ok_or_else(|| UtError::Audio("no default input device available".into()))?,
        };

        let device_name = device
            .description()
            .map(|description| description.name().to_string())
            .map_err(|err| UtError::Audio(format!("failed to read device name: {err}")))?;

        let config = device
            .default_input_config()
            .map_err(|err| UtError::Audio(format!("unable to read default input config: {err}")))?;

        let format = SampleFormat::try_from(config.sample_format())?;
        let spec = AudioSpec {
            sample_rate: config.sample_rate(),
            channels: config.channels(),
            format,
        };

        let bytes_per_chunk = (spec.sample_rate as usize / 1000
            * chunk_ms as usize
            * spec.channels as usize
            * format.bytes_per_sample())
        .max(1);

        let stream_config: cpal::StreamConfig = config.into();

        let error_callback = |err| log::debug!("audio stream warning: {err}");

        let stream = match format {
            SampleFormat::F32 => build_stream::<f32>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::F64 => build_stream::<f64>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::I8 => build_stream::<i8>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::I16 => build_stream::<i16>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::I32 => build_stream::<i32>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::I64 => build_stream::<i64>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::U8 => build_stream::<u8>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::U16 => build_stream::<u16>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::U32 => build_stream::<u32>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
            SampleFormat::U64 => build_stream::<u64>(
                &device,
                stream_config,
                bytes_per_chunk,
                queue.clone(),
                error_callback,
            )?,
        };

        Ok(AudioCapture {
            stream,
            info: CaptureInfo { device_name, spec },
        })
    }

    pub fn play(&self) -> anyhow::Result<()> {
        self.stream
            .play()
            .map_err(|err| UtError::Audio(format!("unable to start audio stream: {err}")).into())
    }
}

fn build_stream<T: cpal::SizedSample + std::fmt::Debug>(
    device: &cpal::Device,
    stream_config: cpal::StreamConfig,
    bytes_per_chunk: usize,
    queue: Arc<RawAudioQueue>,
    error_callback: impl FnMut(cpal::Error) + Send + 'static,
) -> anyhow::Result<cpal::Stream> {
    let mut pending: Vec<u8> = Vec::with_capacity(bytes_per_chunk);
    let stream = device
        .build_input_stream(
            stream_config,
            move |data: &[T], _: &cpal::InputCallbackInfo| {
                if data.is_empty() {
                    return;
                }
                let byte_len = data.len().checked_mul(std::mem::size_of::<T>());
                let Some(byte_len) = byte_len else {
                    return;
                };
                let raw =
                    unsafe { std::slice::from_raw_parts(data.as_ptr() as *const u8, byte_len) };
                pending.extend_from_slice(raw);
                if pending.len() >= bytes_per_chunk {
                    let chunk = RawChunk {
                        bytes: std::mem::take(&mut pending),
                        captured_at: Instant::now(),
                    };
                    queue.push(chunk);
                }
            },
            error_callback,
            Some(Duration::from_millis(100)),
        )
        .map_err(|err| UtError::Audio(format!("unable to build input stream: {err}")))?;
    Ok(stream)
}

pub fn list_input_devices() -> anyhow::Result<()> {
    let host = cpal::default_host();
    let devices = host
        .input_devices()
        .map_err(|err| UtError::Audio(format!("failed to enumerate input devices: {err}")))?;
    for (index, device) in devices.enumerate() {
        let name = device
            .description()
            .map(|description| description.name().to_string());
        match name {
            Ok(name) => println!("{index}: {name}"),
            Err(err) => println!("{index}: <unknown> ({err})"),
        }
    }
    Ok(())
}
