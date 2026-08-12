package course

import "testing"

func TestSlugify(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Go Backend Development", "go-backend-development"},
		{"  Hello   World!  ", "hello-world"},
		{"C++ Programming 101", "c-programming-101"},
		{"Nuxt 3 & Vue.js", "nuxt-3-vue-js"},
		{"---Already--Dashed---", "already-dashed"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := slugify(tt.input)
			if result != tt.expected {
				t.Errorf("slugify(%q) = %q; want %q", tt.input, result, tt.expected)
			}
		})
	}
}
