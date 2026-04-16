# Ubuntu Server Initial Setup

A complete toolkit for hardening a fresh Ubuntu server, available as both a
standalone **Bash script** and an **Ansible playbook**.

---

## 📁 File Structure

```
server_setup/
├── setup.sh                        # Standalone bash script (run directly on server)
└── ansible/
    ├── playbook.yml                # Main playbook (run from your local machine)
    ├── inventory.ini               # Server connection details
    ├── group_vars/
    │   └── all.yml                 # All configuration variables — EDIT THIS FIRST
    └── roles/
        ├── common/                 # System updates & unattended-upgrades
        ├── hardening/              # User, SSH config, Fail2Ban
        ├── firewall/               # UFW rules
        └── monitoring/             # Timezone, hostname, checklist
```

---

## 🚀 Option A — Bash Script

Best for: one-off setup directly on the server.

### 1. Copy the script to your server

```bash
scp setup.sh root@YOUR_SERVER_IP:/root/
```

### 2. SSH into the server and run it

```bash
ssh root@YOUR_SERVER_IP
chmod +x /root/setup.sh
sudo bash /root/setup.sh
```

You will be prompted for:
- New sudo username
- Server hostname
- Path to your SSH public key (optional but recommended)

### CLI options (non-interactive)

```bash
sudo bash setup.sh \
  --username deploy \
  --hostname web-prod-01 \
  --timezone America/New_York \
  --ssh-pub-key /path/to/id_ed25519.pub \
  --skip-reboot
```

| Flag | Description |
|------|-------------|
| `--username NAME` | Non-root sudo user to create |
| `--hostname NAME` | Server hostname |
| `--timezone TZ` | IANA timezone (default: UTC) |
| `--ssh-pub-key PATH` | Path to SSH public key file |
| `--skip-reboot` | Do not reboot after setup |
| `--dry-run` | Print commands without executing |

---

## 🤖 Option B — Ansible Playbook

Best for: automation, multiple servers, repeatable deployments.

### Prerequisites

```bash
pip install ansible
ansible-galaxy collection install community.general ansible.posix
```

### 1. Generate an SSH key pair (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Keys saved to: ~/.ssh/id_ed25519 and ~/.ssh/id_ed25519.pub
```

### 2. Edit `ansible/inventory.ini`

```ini
[ubuntu_servers]
myserver ansible_host=YOUR_SERVER_IP   # ← change this

[ubuntu_servers:vars]
ansible_user=root
ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

### 3. Edit `ansible/group_vars/all.yml`

At minimum, update:

```yaml
new_user: "adminuser"          # Desired username
ssh_public_key: "ssh-ed25519 AAAA..."  # Contents of ~/.ssh/id_ed25519.pub
server_hostname: "my-server"
server_timezone: "UTC"
```

### 4. Run the playbook

```bash
cd ansible/

# Dry-run first
ansible-playbook -i inventory.ini playbook.yml --check

# Full run
ansible-playbook -i inventory.ini playbook.yml
```

### Running specific parts with tags

```bash
ansible-playbook -i inventory.ini playbook.yml --tags user
ansible-playbook -i inventory.ini playbook.yml --tags ssh
ansible-playbook -i inventory.ini playbook.yml --tags firewall
ansible-playbook -i inventory.ini playbook.yml --tags updates
ansible-playbook -i inventory.ini playbook.yml --tags fail2ban
ansible-playbook -i inventory.ini playbook.yml --tags system
ansible-playbook -i inventory.ini playbook.yml --tags verify
```

---

## 🔥 Firewall — Adding Rules Later

### Bash (on the server)

```bash
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow from 192.168.1.0/24 to any port 5432 comment 'PostgreSQL LAN'
sudo ufw deny 3306
sudo ufw delete allow 80/tcp        # Remove a rule
sudo ufw status numbered            # Show numbered rules
sudo ufw delete 3                   # Delete rule #3 by number
```

### Ansible (group_vars/all.yml)

```yaml
ufw_rules:
  - { rule: allow, port: "22",  proto: tcp, comment: "SSH" }
  - { rule: allow, port: "80",  proto: tcp, comment: "HTTP" }
  - { rule: allow, port: "443", proto: tcp, comment: "HTTPS" }
```

---

## ⚙️ Service Management Reference

```bash
# Check status
sudo systemctl status ssh
sudo systemctl status fail2ban
sudo systemctl status ufw

# Start / stop / restart
sudo systemctl start  fail2ban
sudo systemctl stop   fail2ban
sudo systemctl restart ssh

# Enable or disable at boot
sudo systemctl enable  fail2ban
sudo systemctl disable fail2ban
sudo systemctl enable --now fail2ban   # Enable + start immediately

# List all running services
sudo systemctl list-units --type=service --state=running

# List failed units
sudo systemctl --failed
```

---

## 📋 Log Inspection Reference

```bash
# Follow live system logs
journalctl -f

# Logs for a specific service (live)
journalctl -u ssh -f
journalctl -u fail2ban -f

# Logs since last boot
journalctl -b

# Only errors and above
journalctl -p err

# Between two dates
journalctl --since "2024-01-01 00:00:00" --until "2024-01-31 23:59:59"

# Kernel messages
journalctl -k

# Common log files
tail -f /var/log/auth.log       # SSH / sudo attempts
tail -f /var/log/syslog         # General system
tail -f /var/log/ufw.log        # Firewall events
tail -f /var/log/fail2ban.log   # Ban events
```

---

## ✅ Security Checklist

After running the script or playbook, verify everything by reviewing:

```bash
cat /root/security_checklist.txt
```

Manual checks:

```bash
# ── User ─────────────────────────────────────────────────────────
id adminuser                         # User exists
sudo -l -U adminuser                 # Has sudo

# ── SSH ──────────────────────────────────────────────────────────
sshd -T | grep -E 'permitrootlogin|passwordauth|pubkeyauth'
ssh adminuser@localhost              # Login works

# ── Firewall ─────────────────────────────────────────────────────
sudo ufw status verbose

# ── Fail2Ban ─────────────────────────────────────────────────────
sudo fail2ban-client status sshd

# ── Updates ──────────────────────────────────────────────────────
sudo unattended-upgrade --dry-run

# ── Timezone / Hostname ──────────────────────────────────────────
timedatectl
hostname
```

---

## ⚠️ Important Notes

1. **Always test SSH key login before disabling password auth.** Open a second terminal and verify you can connect with the key before closing your root session.
2. The script sets up **passwordless sudo** for convenience. For stricter security, remove the `NOPASSWD` entry from `/etc/sudoers.d/90-<user>`.
3. A **reboot** is recommended after initial setup to apply all kernel updates. The bash script will reboot automatically unless `--skip-reboot` is passed.
