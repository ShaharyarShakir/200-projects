{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
  enable = true;
  pnpm.enable = true;
};
  languages.python = {
    enable = true;
    venv.enable = true;
    uv = {
      enable = true;
      sync.enable = true;
    };
  };
}
