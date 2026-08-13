package worker

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSelectRenditions(t *testing.T) {
	tests := []struct {
		name         string
		sourceHeight int
		expected     []string
	}{
		{
			name:         "720p source",
			sourceHeight: 720,
			expected:     []string{"360p", "480p", "720p"},
		},
		{
			name:         "1080p source",
			sourceHeight: 1080,
			expected:     []string{"360p", "480p", "720p", "1080p"},
		},
		{
			name:         "240p low resolution source",
			sourceHeight: 240,
			expected:     []string{"360p"}, // fallback to at least 1 rendition
		},
		{
			name:         "4K 2160p source",
			sourceHeight: 2160,
			expected:     []string{"360p", "480p", "720p", "1080p", "2160p"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := selectRenditions(tt.sourceHeight)
			if len(got) != len(tt.expected) {
				t.Fatalf("expected %d renditions, got %d", len(tt.expected), len(got))
			}
			for i, r := range got {
				if r.Name != tt.expected[i] {
					t.Errorf("rendition %d: expected name %s, got %s", i, tt.expected[i], r.Name)
				}
			}
		})
	}
}

func TestGenerateMasterPlaylist(t *testing.T) {
	tempDir := t.TempDir()
	masterPath := filepath.Join(tempDir, "master.m3u8")

	renditions := selectRenditions(720)
	err := generateMasterPlaylist(masterPath, renditions)
	if err != nil {
		t.Fatalf("generateMasterPlaylist failed: %v", err)
	}

	content, err := os.ReadFile(masterPath)
	if err != nil {
		t.Fatalf("read master playlist: %v", err)
	}

	strContent := string(content)
	if !contains(strContent, "#EXTM3U") {
		t.Errorf("master playlist missing #EXTM3U header")
	}
	if !contains(strContent, "360p/index.m3u8") {
		t.Errorf("master playlist missing 360p playlist entry")
	}
	if !contains(strContent, "720p/index.m3u8") {
		t.Errorf("master playlist missing 720p playlist entry")
	}
}

func contains(s, substr string) bool {
	return filepath.HasPrefix(s, substr) || len(s) >= len(substr) && (s == substr || len(s) > 0 && findSubstr(s, substr))
}

func findSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
