#!/usr/bin/env bash
set -euo pipefail

DESKTOP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$DESKTOP_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/physicax-web"
RELEASE_DIR="$DESKTOP_DIR/dist/linux-release"

failures=0
warnings=0
software_renderer=0
hardware_renderer=0
nvidia_present=0
nvidia_driver_ok=0
nvidia_driver_broken=0
display_session=0
gpu_next_command="cd \"$ROOT_DIR\" && bash scripts/run-desktop-linux.sh"
gpu_verdict="Run the standard desktop helper while you inspect the renderer path."

print_status() {
  local level="$1"
  local label="$2"
  local detail="$3"
  printf '[%s] %s: %s\n' "$level" "$label" "$detail"
}

require_cmd() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    print_status ok "$cmd" "$(command -v "$cmd")"
  else
    print_status fail "$cmd" "not installed"
    failures=$((failures + 1))
  fi
}

check_path() {
  local label="$1"
  local path="$2"
  if [[ -e "$path" ]]; then
    print_status ok "$label" "$path"
  else
    print_status fail "$label" "missing: $path"
    failures=$((failures + 1))
  fi
}

warn_if_missing() {
  local label="$1"
  local path="$2"
  local hint="$3"
  if [[ -e "$path" ]]; then
    print_status ok "$label" "$path"
  else
    print_status warn "$label" "$hint"
    warnings=$((warnings + 1))
  fi
}

warn_if_missing_exec() {
  local label="$1"
  local path="$2"
  local hint="$3"
  if [[ -x "$path" ]]; then
    print_status ok "$label" "$path"
  else
    print_status warn "$label" "$hint"
    warnings=$((warnings + 1))
  fi
}

print_status info "root" "$ROOT_DIR"
print_status info "desktop" "$DESKTOP_DIR"

require_cmd node
require_cmd npm
require_cmd python3

check_path "repo root" "$ROOT_DIR/README.md"
check_path "root requirements" "$ROOT_DIR/requirements.txt"
check_path "web package" "$WEB_DIR/package.json"
check_path "desktop package" "$DESKTOP_DIR/package.json"

warn_if_missing "python venv" "$ROOT_DIR/.venv" "optional but recommended: run python3 -m venv .venv"
warn_if_missing "web node_modules" "$WEB_DIR/node_modules" "run: cd \"$WEB_DIR\" && npm install"
warn_if_missing "desktop node_modules" "$DESKTOP_DIR/node_modules" "run: cd \"$DESKTOP_DIR\" && npm install"
warn_if_missing "web production build" "$WEB_DIR/.next/standalone/server.js" "run: cd \"$DESKTOP_DIR\" && npm run desktop:prepare-runtime:linux"
warn_if_missing_exec "bundled CFD backend" "$DESKTOP_DIR/backend/dist/physicax-cfd-backend" "run: cd \"$DESKTOP_DIR\" && npm run desktop:build-backend:linux"
warn_if_missing "linux release folder" "$RELEASE_DIR" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing_exec "linux launcher" "$RELEASE_DIR/run-PhysicaX-linux.sh" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing_exec "wsl launcher" "$RELEASE_DIR/run-PhysicaX-wsl.sh" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing_exec "deb installer helper" "$RELEASE_DIR/install-PhysicaX-deb.sh" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "release readme" "$RELEASE_DIR/README.txt" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "linux AppImage" "$RELEASE_DIR/PhysicaX-0.1.0.AppImage" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "linux deb package" "$RELEASE_DIR/physicax-desktop_0.1.0_amd64.deb" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "github release tarball" "$DESKTOP_DIR/dist/PhysicaX-0.1.0-linux-release.tar.gz" "run: cd \"$DESKTOP_DIR\" && npm run desktop:package:linux"
warn_if_missing "release verification summary" "$RELEASE_DIR/verification-summary.json" "run: cd \"$DESKTOP_DIR\" && npm run desktop:verify-release:linux"

gpu_list=""
gpu_count=0
if command -v lspci >/dev/null 2>&1; then
  gpu_list="$(lspci | grep -E 'VGA|3D|Display' || true)"
  gpu_line="$(printf '%s\n' "$gpu_list" | head -n 1 || true)"
  gpu_count="$(printf '%s\n' "$gpu_list" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [[ -n "$gpu_line" ]]; then
    print_status info "gpu adapter" "$gpu_line"
  fi
  if [[ "$gpu_count" -gt 1 ]]; then
    print_status info "gpu topology" "hybrid / multi-GPU (${gpu_count} adapters detected)"
  fi
fi

print_status info "session" "${XDG_SESSION_TYPE:-unknown}"
if [[ -n "${WAYLAND_DISPLAY:-}" || -n "${DISPLAY:-}" ]]; then
  display_session=1
fi
if [[ -n "${DRI_PRIME:-}" || -n "${__NV_PRIME_RENDER_OFFLOAD:-}" ]]; then
  print_status info "gpu offload request" "DRI_PRIME=${DRI_PRIME:-unset} __NV_PRIME_RENDER_OFFLOAD=${__NV_PRIME_RENDER_OFFLOAD:-unset}"
fi

if command -v prime-run >/dev/null 2>&1; then
  print_status ok "prime-run" "$(command -v prime-run)"
elif command -v nvidia-smi >/dev/null 2>&1 && [[ "$gpu_count" -gt 1 ]]; then
  print_status info "prime-run" "not installed; use PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh to try NVIDIA offload manually"
fi

if command -v glxinfo >/dev/null 2>&1; then
  if (( display_session > 0 )); then
    renderer="$(glxinfo -B 2>/dev/null | awk -F': ' '/OpenGL renderer string/ {print $2; exit}')"
    vendor="$(glxinfo -B 2>/dev/null | awk -F': ' '/OpenGL vendor string/ {print $2; exit}')"
    if [[ -n "$renderer" ]]; then
      if [[ "$renderer" =~ llvmpipe|softpipe|SwiftShader|swiftshader ]]; then
        print_status warn "opengl renderer" "$renderer (software rendering detected)"
        warnings=$((warnings + 1))
        software_renderer=1
        gpu_verdict="The session is using software rendering, so PhysicaX will feel laggy until the graphics stack is fixed."
      else
        print_status ok "opengl renderer" "${renderer}${vendor:+ | vendor: $vendor}"
        hardware_renderer=1
        gpu_next_command="cd \"$ROOT_DIR\" && bash scripts/run-desktop-linux-gpu.sh"
        gpu_verdict="The active Linux session is already using real hardware rendering."
        if command -v nvidia-smi >/dev/null 2>&1 && [[ "$gpu_count" -gt 1 ]] && [[ ! "$renderer" =~ NVIDIA ]]; then
          print_status info "gpu offload" "an NVIDIA GPU is also present. Use PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh only if you want to try the dedicated GPU."
        fi
      fi
    else
      print_status warn "opengl renderer" "glxinfo is installed but the active desktop session did not return a renderer"
      warnings=$((warnings + 1))
      gpu_verdict="The desktop session did not expose a renderer string, so rerun this from the active X11 or Wayland session."
    fi
  else
    print_status warn "opengl renderer" "no DISPLAY/WAYLAND_DISPLAY found; run the doctor from the active desktop session to confirm hardware acceleration"
    warnings=$((warnings + 1))
    gpu_verdict="No active desktop display was detected, so hardware acceleration cannot be verified from this shell."
  fi
else
  print_status warn "glxinfo" "install mesa-utils to verify the OpenGL renderer (recommended on Linux and Kali)"
  warnings=$((warnings + 1))
  gpu_verdict="Install mesa-utils first so PhysicaX can tell whether Kali is using real GPU rendering or a software fallback."
fi

if command -v vulkaninfo >/dev/null 2>&1; then
  print_status ok "vulkaninfo" "$(command -v vulkaninfo)"
  vulkan_summary="$(vulkaninfo --summary 2>/dev/null | awk -F'= ' '/GPU id/ {print $2; exit}' || true)"
  if [[ -n "$vulkan_summary" ]]; then
    print_status info "vulkan summary" "$vulkan_summary"
  fi
else
  print_status warn "vulkaninfo" "install vulkan-tools for extra GPU verification on Linux"
  warnings=$((warnings + 1))
fi

if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia_present=1
  nvidia_summary="$(nvidia-smi --query-gpu=name,driver_version --format=csv,noheader 2>/dev/null | head -n 1 || true)"
  if [[ -n "$nvidia_summary" ]]; then
    print_status ok "nvidia-smi" "$nvidia_summary"
    nvidia_driver_ok=1
  else
    print_status warn "nvidia-smi" "installed, but the NVIDIA driver is not responding to user space"
    warnings=$((warnings + 1))
    nvidia_driver_broken=1
  fi
fi

if (( nvidia_driver_broken > 0 && hardware_renderer > 0 )); then
  print_status info "nvidia state" "NVIDIA is not attached cleanly right now, but the active OpenGL renderer is still hardware-backed. Intel or AMD output here is valid acceleration on Kali."
fi

if (( hardware_renderer > 0 && software_renderer == 0 )); then
  if (( nvidia_present > 0 && nvidia_driver_ok > 0 && gpu_count > 1 )) && [[ "${renderer:-}" != *NVIDIA* ]]; then
    gpu_next_command="cd \"$ROOT_DIR\" && PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh"
    gpu_verdict="Kali is already accelerated on the active GPU. Use the discrete-GPU helper only if you specifically want to try NVIDIA offload."
  else
    gpu_next_command="cd \"$ROOT_DIR\" && bash scripts/run-desktop-linux-gpu.sh"
    gpu_verdict="PhysicaX can use the normal GPU-preferred Linux helper on this renderer path."
  fi
elif (( software_renderer > 0 )); then
  gpu_next_command="cd \"$ROOT_DIR\" && bash scripts/run-desktop-linux.sh"
elif (( display_session == 0 )); then
  gpu_next_command="cd \"$ROOT_DIR\" && npm --prefix physicax-desktop run desktop:doctor:linux"
fi

print_status info "gpu verdict" "$gpu_verdict"
print_status info "next launch" "$gpu_next_command"

echo
if (( failures > 0 )); then
  print_status fail "summary" "$failures blocking issue(s), $warnings warning(s)"
  exit 1
fi

if (( warnings > 0 )); then
  print_status warn "summary" "core prerequisites are present, but $warnings follow-up step(s) are still recommended"
else
  print_status ok "summary" "Linux desktop prerequisites and artifacts look ready"
fi
