package processor

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
)

type Processor struct {
	imageName string
}

func New() *Processor {
	return &Processor{
		imageName: "academy-ffmpeg:local",
	}
}

func (p *Processor) Process(
	ctx context.Context,
	inputFile string,
	outputDir string,
) error {
	workDir := filepath.Dir(filepath.Clean(outputDir))

	cmd := exec.CommandContext(
		ctx,
		"docker",
		"run",
		"--rm",
		"-v", fmt.Sprintf("%s:/work:z", workDir),
		p.imageName,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg processing failed: %w, output: %s", err, string(output))
	}

	return nil
}
