#!/usr/bin/env bash
# =============================================================================
# Ubuntu Server Initial Setup Script
# =============================================================================
# Usage: sudo bash setup.sh [OPTIONS]
#
# Options:
#   --username NAME       Non-root sudo user to create (default: prompted)
#   --hostname NAME       Server hostname (default: prompted)
#   --timezone TZ         Timezone (default: UTC)
#   --ssh-pub-key PATH    Path to SSH public key file to authorize
#   --skip-reboot         Do not reboot after setup
#   --dry-run             Print actions without executing
#   -h, --help            Show this help
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ── Defaults ─────────────────────────────────────────────────────────────────
NEW_USER=""
NEW_HOSTNAME=""
TIMEZONE="UTC"
SSH_PUB_KEY_PATH=""
SKIP_REBOOT=false
DRY_RUN=false
LOG_FILE="/var/log/server_setup.log"
CHECKLIST_FILE="/root/security_checklist.txt"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()     { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✔  $*${RESET}" | tee -a "$LOG_FILE"; }
info()    { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ  $*${RESET}" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠  $*${RESET}" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}[$(date '+%H:%M:%S')] ✖  $*${RESET}" | tee -a "$LOG_FILE" >&2; }
section() { echo -e "\n${BOLD}${CYAN}══════════════════════════════════════════════════════${RESET}"; \
            echo -e "${BOLD}${CYAN}  $*${RESET}"; \
            echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════${RESET}"; }
run()     { if $DRY_RUN; then echo "[DRY-RUN] $*"; else eval "$@"; fi; }

die() { error "$*"; exit 1; }

check_root() {
  [[ $EUID -eq 0 ]] || die "This script must be run as root. Try: sudo bash $0"
}

# ── Argument parsing ──────────────────────────────────────────────────────────
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --username)    NEW_USER="$2";          shift 2 ;;
      --hostname)    NEW_HOSTNAME="$2";      shift 2 ;;
      --timezone)    TIMEZONE="$2";          shift 2 ;;
      --ssh-pub-key) SSH_PUB_KEY_PATH="$2";  shift 2 ;;
      --skip-reboot) SKIP_REBOOT=true;       shift ;;
      --dry-run)     DRY_RUN=true;           shift ;;
      -h|--help)     grep '^#' "$0" | head -20 | sed 's/^# \?//'; exit 0 ;;
      *) die "Unknown option: $1" ;;
    esac
  done
}

# ── Interactive prompts ───────────────────────────────────────────────────────
prompt_inputs() {
  if [[ -z "$NEW_USER" ]]; then
    read -rp "$(echo -e "${CYAN}Enter the new sudo username: ${RESET}")" NEW_USER
    [[ -n "$NEW_USER" ]] || die "Username cannot be empty."
  fi

  if [[ -z "$NEW_HOSTNAME" ]]; then
    read -rp "$(echo -e "${CYAN}Enter the new server hostname [current: $(hostname)]: ${RESET}")" NEW_HOSTNAME
    NEW_HOSTNAME="${NEW_HOSTNAME:-$(hostname)}"
  fi

  if [[ -z "$SSH_PUB_KEY_PATH" ]]; then
    read -rp "$(echo -e "${CYAN}Path to SSH public key (leave blank to skip): ${RESET}")" SSH_PUB_KEY_PATH
  fi
}

# ── 1. User Setup ─────────────────────────────────────────────────────────────
setup_user() {
  section "1. User Setup"
  if id "$NEW_USER" &>/dev/null; then
    warn "User '$NEW_USER' already exists — skipping creation."
  else
    run "adduser --gecos '' --disabled-password '$NEW_USER'"
    run "echo '${NEW_USER}:$(openssl rand -base64 24)' | chpasswd"
    log "User '$NEW_USER' created."
  fi

  run "usermod -aG sudo '$NEW_USER'"
  log "User '$NEW_USER' added to sudo group."

  # Passwordless sudo (optional — comment out for stricter setups)
  local sudoers_file="/etc/sudoers.d/90-${NEW_USER}"
  run "echo '${NEW_USER} ALL=(ALL) NOPASSWD:ALL' > '$sudoers_file'"
  run "chmod 0440 '$sudoers_file'"
  log "Sudoers entry created at $sudoers_file."
}

# ── 2. SSH Configuration ──────────────────────────────────────────────────────
setup_ssh() {
  section "2. SSH Configuration"
  local ssh_dir="/home/${NEW_USER}/.ssh"
  local auth_keys="${ssh_dir}/authorized_keys"

  run "mkdir -p '$ssh_dir'"
  run "chmod 700 '$ssh_dir'"
  run "touch '$auth_keys'"
  run "chmod 600 '$auth_keys'"
  run "chown -R '${NEW_USER}:${NEW_USER}' '$ssh_dir'"

  if [[ -n "$SSH_PUB_KEY_PATH" && -f "$SSH_PUB_KEY_PATH" ]]; then
    run "cat '$SSH_PUB_KEY_PATH' >> '$auth_keys'"
    log "SSH public key installed for '$NEW_USER'."
  else
    warn "No SSH public key provided. Password auth will be disabled — ensure you have another auth method!"
  fi

  local sshd_config="/etc/ssh/sshd_config"
  info "Hardening $sshd_config ..."

  # Backup original
  run "cp '$sshd_config' '${sshd_config}.bak.$(date +%Y%m%d%H%M%S)'"

  declare -A SSH_SETTINGS=(
    ["PermitRootLogin"]="no"
    ["PasswordAuthentication"]="no"
    ["PubkeyAuthentication"]="yes"
    ["AuthorizedKeysFile"]=".ssh/authorized_keys"
    ["X11Forwarding"]="no"
    ["AllowTcpForwarding"]="no"
    ["MaxAuthTries"]="3"
    ["LoginGraceTime"]="30"
    ["ClientAliveInterval"]="300"
    ["ClientAliveCountMax"]="2"
    ["Protocol"]="2"
    ["PermitEmptyPasswords"]="no"
    ["ChallengeResponseAuthentication"]="no"
  )

  for key in "${!SSH_SETTINGS[@]}"; do
    local value="${SSH_SETTINGS[$key]}"
    if grep -qE "^#?${key}" "$sshd_config"; then
      run "sed -i 's|^#\?${key}.*|${key} ${value}|' '$sshd_config'"
    else
      run "echo '${key} ${value}' >> '$sshd_config'"
    fi
  done

  run "systemctl restart ssh"
  log "SSH hardened and service restarted."
}

# ── 3. Firewall (UFW) ─────────────────────────────────────────────────────────
setup_firewall() {
  section "3. Firewall Configuration (UFW)"
  run "apt-get install -y ufw"
  run "ufw --force reset"
  run "ufw default deny incoming"
  run "ufw default allow outgoing"
  run "ufw allow 22/tcp comment 'SSH'"
  run "ufw --force enable"
  run "ufw status verbose" && ufw status verbose | tee -a "$LOG_FILE" || true
  log "UFW firewall configured."

  info "To add more rules later:"
  info "  ufw allow 80/tcp    # HTTP"
  info "  ufw allow 443/tcp   # HTTPS"
  info "  ufw allow from 192.168.1.0/24 to any port 5432  # PostgreSQL from LAN"
  info "  ufw deny 3306       # Explicitly deny MySQL"
  info "  ufw delete allow 80/tcp  # Remove a rule"
}

# ── 4. System Updates & Auto-security Updates ─────────────────────────────────
setup_updates() {
  section "4. System Updates & Unattended Upgrades"
  run "apt-get update -y"
  run "apt-get upgrade -y"
  run "apt-get dist-upgrade -y"
  run "apt-get install -y unattended-upgrades apt-listchanges"

  run "cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    \"\${distro_id}:\${distro_codename}-security\";
    \"\${distro_id}ESMApps:\${distro_codename}-apps-security\";
    \"\${distro_id}ESM:\${distro_codename}-infra-security\";
};
Unattended-Upgrade::Package-Blacklist {};
Unattended-Upgrade::DevRelease \"false\";
Unattended-Upgrade::Remove-Unused-Kernel-Packages \"true\";
Unattended-Upgrade::Remove-New-Unused-Dependencies \"true\";
Unattended-Upgrade::Remove-Unused-Dependencies \"true\";
Unattended-Upgrade::Automatic-Reboot \"false\";
Unattended-Upgrade::Automatic-Reboot-Time \"02:00\";
Unattended-Upgrade::Mail \"\";
Unattended-Upgrade::MailReport \"only-on-error\";
EOF"

  run "cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists \"1\";
APT::Periodic::Download-Upgradeable-Packages \"1\";
APT::Periodic::AutocleanInterval \"7\";
APT::Periodic::Unattended-Upgrade \"1\";
EOF"

  run "systemctl enable --now unattended-upgrades"
  log "Automatic security updates configured."
}

# ── 5. Fail2Ban ───────────────────────────────────────────────────────────────
setup_fail2ban() {
  section "5. Fail2Ban (Brute-Force Protection)"
  run "apt-get install -y fail2ban"

  run "cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd
banaction = ufw

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
maxretry = 3
bantime  = 86400
EOF"

  run "systemctl enable --now fail2ban"
  run "systemctl restart fail2ban"
  log "Fail2Ban installed and configured."

  info "Useful Fail2Ban commands:"
  info "  fail2ban-client status sshd         # View SSH jail status"
  info "  fail2ban-client set sshd unbanip IP # Unban an IP"
  info "  fail2ban-client banned              # List all banned IPs"
}

# ── 6. Timezone & Hostname ────────────────────────────────────────────────────
setup_system() {
  section "6. Timezone & Hostname"
  run "timedatectl set-timezone '$TIMEZONE'"
  log "Timezone set to $TIMEZONE."

  run "hostnamectl set-hostname '$NEW_HOSTNAME'"
  if grep -q "127.0.1.1" /etc/hosts; then
    run "sed -i 's/127.0.1.1.*/127.0.1.1\t${NEW_HOSTNAME}/' /etc/hosts"
  else
    run "echo '127.0.1.1\t${NEW_HOSTNAME}' >> /etc/hosts"
  fi
  log "Hostname set to '$NEW_HOSTNAME'."
}

# ── 7. Service Management Cheatsheet ─────────────────────────────────────────
show_service_management() {
  section "7. Service Management Reference"
  cat << 'EOF'
  ┌─────────────────────────────────────────────────────────────────────┐
  │                  systemctl Cheat Sheet                              │
  ├──────────────────────────────┬──────────────────────────────────────┤
  │ Check status                 │ systemctl status <service>           │
  │ Start service                │ systemctl start <service>            │
  │ Stop service                 │ systemctl stop <service>             │
  │ Restart service              │ systemctl restart <service>          │
  │ Reload config (no restart)   │ systemctl reload <service>           │
  │ Enable at boot               │ systemctl enable <service>           │
  │ Disable at boot              │ systemctl disable <service>          │
  │ Enable + start now           │ systemctl enable --now <service>     │
  │ List all running             │ systemctl list-units --type=service  │
  │ List failed units            │ systemctl --failed                   │
  │ Check if enabled             │ systemctl is-enabled <service>       │
  └──────────────────────────────┴──────────────────────────────────────┘
EOF
}

# ── 8. Log Inspection Cheatsheet ─────────────────────────────────────────────
show_log_reference() {
  section "8. Log Inspection Reference"
  cat << 'EOF'
  ┌─────────────────────────────────────────────────────────────────────┐
  │                  journalctl Cheat Sheet                             │
  ├──────────────────────────────┬──────────────────────────────────────┤
  │ All logs (newest first)      │ journalctl -r                        │
  │ Follow live logs             │ journalctl -f                        │
  │ Logs for a service           │ journalctl -u <service> -f           │
  │ Logs since last boot         │ journalctl -b                        │
  │ Logs with priority (errors)  │ journalctl -p err                    │
  │ Logs between dates           │ journalctl --since "2024-01-01"      │
  │                              │           --until "2024-01-31"       │
  │ Kernel messages              │ journalctl -k                        │
  │ Disk usage of journal        │ journalctl --disk-usage              │
  │ Vacuum logs older than 7d    │ journalctl --vacuum-time=7d          │
  └──────────────────────────────┴──────────────────────────────────────┘

  Common log files in /var/log/:
    auth.log        – Authentication attempts (SSH, sudo)
    syslog          – General system messages
    kern.log        – Kernel messages
    ufw.log         – UFW firewall events
    fail2ban.log    – Fail2Ban actions and bans
    apt/history.log – Package install/remove history
    dpkg.log        – Low-level package operations
EOF
}

# ── 9. Security Checklist ─────────────────────────────────────────────────────
generate_checklist() {
  section "9. Security Verification Checklist"

  local fail2ban_status ufw_status unattended_status ssh_root ssh_pw
  fail2ban_status=$(systemctl is-active fail2ban 2>/dev/null || echo "unknown")
  ufw_status=$(ufw status | grep -c "Status: active" || echo "0")
  unattended_status=$(systemctl is-active unattended-upgrades 2>/dev/null || echo "unknown")
  ssh_root=$(grep -E "^PermitRootLogin" /etc/ssh/sshd_config | awk '{print $2}' || echo "unknown")
  ssh_pw=$(grep -E "^PasswordAuthentication" /etc/ssh/sshd_config | awk '{print $2}' || echo "unknown")

  local checks=()
  check_item() {
    local label="$1" ok="$2"
    if [[ "$ok" == "true" ]]; then
      checks+=("$(echo -e "  ${GREEN}✔${RESET}  $label")")
    else
      checks+=("$(echo -e "  ${RED}✖${RESET}  $label")")
    fi
  }

  check_item "Non-root sudo user '$NEW_USER' exists"        "$(id "$NEW_USER" &>/dev/null && echo true || echo false)"
  check_item "SSH authorized_keys present for $NEW_USER"   "$([ -s /home/${NEW_USER}/.ssh/authorized_keys ] && echo true || echo false)"
  check_item "PermitRootLogin = no"                        "$( [[ "$ssh_root" == "no" ]] && echo true || echo false )"
  check_item "PasswordAuthentication = no"                 "$( [[ "$ssh_pw"   == "no" ]] && echo true || echo false )"
  check_item "UFW firewall active"                         "$( [[ "$ufw_status" -ge 1 ]] && echo true || echo false )"
  check_item "Fail2Ban active"                             "$( [[ "$fail2ban_status" == "active" ]] && echo true || echo false )"
  check_item "Unattended-upgrades active"                  "$( [[ "$unattended_status" == "active" ]] && echo true || echo false )"
  check_item "Hostname set to '$NEW_HOSTNAME'"             "$( [[ "$(hostname)" == "$NEW_HOSTNAME" ]] && echo true || echo false )"
  check_item "Timezone set to $TIMEZONE"                   "$( [[ "$(timedatectl show -p Timezone --value)" == "$TIMEZONE" ]] && echo true || echo false )"

  {
    echo "Security Checklist — $(date)"
    echo "Server: $(hostname) | User: ${NEW_USER}"
    echo "================================================"
    for item in "${checks[@]}"; do echo -e "$item"; done
    echo ""
    echo "SSH Port:      22"
    echo "UFW Rules:"; ufw status numbered
    echo ""
    echo "Fail2Ban Status:"; fail2ban-client status sshd 2>/dev/null || echo "Fail2Ban not available"
  } | tee "$CHECKLIST_FILE"

  log "Checklist saved to $CHECKLIST_FILE"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  check_root
  parse_args "$@"

  # Ensure log file exists
  touch "$LOG_FILE"
  chmod 600 "$LOG_FILE"

  echo -e "\n${BOLD}${GREEN}"
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║     Ubuntu Server Initial Setup Script       ║"
  echo "  ║     $(date '+%Y-%m-%d %H:%M:%S')                      ║"
  echo "  ╚══════════════════════════════════════════════╝"
  echo -e "${RESET}"

  prompt_inputs

  info "Starting setup with:"
  info "  Username  : $NEW_USER"
  info "  Hostname  : $NEW_HOSTNAME"
  info "  Timezone  : $TIMEZONE"
  info "  Dry-run   : $DRY_RUN"
  echo ""

  setup_user
  setup_ssh
  setup_firewall
  setup_updates
  setup_fail2ban
  setup_system
  show_service_management
  show_log_reference
  generate_checklist

  section "Setup Complete!"
  log "All tasks finished. Log: $LOG_FILE"

  if ! $SKIP_REBOOT; then
    warn "The system will reboot in 30 seconds. Press Ctrl+C to cancel."
    sleep 30
    run "reboot"
  else
    warn "Skipping reboot (--skip-reboot). Some changes may require a restart."
  fi
}

main "$@"
