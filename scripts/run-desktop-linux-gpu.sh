#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PHYSICAX_GPU_MODE=high
gpu_lines=""
gpu_count=0
requested_gpu="${PHYSICAX_GPU_VENDOR:-active}"

if command -v lspci >/dev/null 2>&1; then
  gpu_lines="$(lspci | grep -E 'VGA|3D|Display' || true)"
  gpu_count="$(printf '%s\n' "$gpu_lines" | sed '/^$/d' | wc -l | tr -d ' ')"
fi

if [[ "$requested_gpu" == "discrete" || "$requested_gpu" == "nvidia" ]]; then
  if command -v prime-run >/dev/null 2>&1; then
    printf '[physicax] Using prime-run to request the discrete GPU\n'
    exec prime-run bash "$SCRIPT_DIR/run-desktop-linux.sh"
  fi

  if command -v nvidia-smi >/dev/null 2>&1; then
    export __NV_PRIME_RENDER_OFFLOAD="${__NV_PRIME_RENDER_OFFLOAD:-1}"
    export __GLX_VENDOR_LIBRARY_NAME="${__GLX_VENDOR_LIBRARY_NAME:-nvidia}"
    export __VK_LAYER_NV_optimus="${__VK_LAYER_NV_optimus:-NVIDIA_only}"
    printf '[physicax] Requesting NVIDIA PRIME offload with native GPU mode\n'
  elif [[ "$gpu_count" -gt 1 ]]; then
    export DRI_PRIME="${DRI_PRIME:-1}"
    printf '[physicax] Requesting DRI_PRIME=1 for the higher-performance GPU\n'
  else
    printf '[physicax] No discrete GPU offload path was detected; using the active Linux GPU instead\n'
  fi
else
  printf '[physicax] Requesting native GPU mode on the active Linux GPU\n'
  if command -v nvidia-smi >/dev/null 2>&1 && [[ "$gpu_count" -gt 1 ]]; then
    printf '[physicax] Tip: run PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh if you want to try the NVIDIA GPU on a hybrid laptop\n'
  fi
fi

exec bash "$SCRIPT_DIR/run-desktop-linux.sh"
