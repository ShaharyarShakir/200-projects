CREATE UNIQUE INDEX IF NOT EXISTS idx_academies_subdomain ON academies(subdomain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_academies_custom_domain ON academies(custom_domain) WHERE custom_domain IS NOT NULL AND custom_domain != '';
