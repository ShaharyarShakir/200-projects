use anyhow::Result;
use env_logger::Env;

mod app;
mod audio;
mod config;
mod diagnostics;
mod error;
mod stt;
mod transcription;
mod ui;
mod vad;

use config::{CliArgs, Config};

fn main() -> Result<()> {
    let cli = CliArgs::parse(std::env::args());

    if cli.help {
        print_help();
        return Ok(());
    }
    if cli.list_devices {
        return match app::list_devices() {
            Ok(()) => Ok(()),
            Err(err) => Err(err),
        };
    }

    let config = Config::load()?;

    let default_level = if config.debug { "debug" } else { "info" };
    env_logger::Builder::from_env(Env::default().default_filter_or(default_level))
        .format_timestamp_millis()
        .init();

    if config.debug {
        whisper_rs::install_logging_hooks();
    }

    println!("uType — Phase 1C");
    println!("────────────────────────────────────");
    println!();

    app::run(&config)?;

    Ok(())
}

fn print_help() {
    println!("uType — local real-time dictation (Phase 1C)");
    println!();
    println!("USAGE:");
    println!("  utype [OPTIONS]");
    println!();
    println!("OPTIONS:");
    println!(
        "  --model <path>           Whisper ggml model file (required for the whisper backend)"
    );
    println!("  --backend <name>         'whisper' (default) or 'echo' (pipeline test only)");
    println!("  --device <name>          Input device name (see --list-devices)");
    println!("  --language <code>        Whisper language, e.g. 'en' (default: en)");
    println!("  --threads <n>            Whisper CPU threads (default: 4)");
    println!("  --sample-rate <n>        Target sample rate (default: 16000)");
    println!("  --window-ms <n>          Inference window in ms (default: 2000)");
    println!("  --interval-ms <n>        Inference update interval in ms (default: 300)");
    println!(
        "  --min-audio-ms <n>       Minimum audio for the first inference in ms (default: 500)"
    );
    println!(
        "  --overlap-ms <n>         Overlap between rolling windows in ms (default: window - interval)"
    );
    println!("  --stability <n>          Consecutive confirmations before committing (default: 2)");
    println!(
        "  --silence-timeout-ms <n> Silence before finalizing an utterance in ms (default: 700)"
    );
    println!("  --rms-threshold <n>      Energy VAD RMS threshold (default: 0.0025)");
    println!("  --debug                  Enable debug diagnostics");
    println!("  --list-devices           List available input devices and exit");
    println!("  --help                   Show this help");
    println!();
    println!("ENVIRONMENT:");
    println!("  UTYPE_MODEL_PATH         Whisper model path (same as --model)");
    println!("  UTYPE_DEBUG=1            Enable debug diagnostics");
    println!("  UTYPE_RMS_THRESHOLD      Energy VAD threshold");
    println!("  ... all --options also exist as UTYPE_<UPPER_SNAKE> variables");
    println!();
    println!("MODEL SETUP:");
    println!("  Download an English whisper ggml model (e.g. ggml-base.bin or ggml-tiny.bin)");
    println!("  from the whisper.cpp releases, then point --model or UTYPE_MODEL_PATH at it.");
}
