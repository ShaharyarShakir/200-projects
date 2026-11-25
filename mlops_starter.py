import marimo

__generated_with = "0.10.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import marimo as mo
    mo.md(
        """
        # 🚀 Sovereign MLOps Lab: Reactive Notebook
        This notebook runs in **Marimo**, the next-generation reactive Python notebook.
        Any variable update automatically propagates through the computation graph.
        """
    )
    return mo,


@app.cell
def __(mo):
    slider = mo.ui.slider(1, 100, value=25, label="Sample Size")
    batch_size = mo.ui.dropdown(options=["16", "32", "64", "128"], value="32", label="Batch Size")
    mo.hstack([slider, batch_size], justify="start", gap=2)
    return batch_size, slider


@app.cell
def __(mo, slider, batch_size):
    import polars as pl
    import numpy as np

    n = slider.value
    bs = int(batch_size.value)

    # Reactive mock dataset generation
    rng = np.random.default_rng(seed=42)
    df = pl.DataFrame({
        "step": list(range(1, n + 1)),
        "loss": (rng.normal(loc=0.5, scale=0.1, size=n) / np.sqrt(np.arange(1, n + 1))).tolist(),
        "accuracy": np.clip(rng.normal(loc=0.8, scale=0.05, size=n), 0, 1.0).tolist(),
    })

    mo.md(f"**Generated Dataframe** (Size: {n} steps, Batch: {bs})")
    return bs, df, n, np, pl, rng


@app.cell
def __(df):
    df
    return


if __name__ == "__main__":
    app.run()
