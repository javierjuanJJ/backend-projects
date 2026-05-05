// src/consts/storage.js
// Storage backend definitions and their required parameters

const STORAGE_BACKENDS = {
  LOCAL: 'local',
  AWS_S3: 'aws-s3',
  GCS: 'gcs',
  AZURE: 'azure',
  SSH: 'ssh',
  FTP: 'ftp',
  SAMBA: 'samba',
  NFS: 'nfs',
};

// Human-readable aliases accepted from CLI
const STORAGE_ALIASES = {
  'local': STORAGE_BACKENDS.LOCAL,
  'aws s3': STORAGE_BACKENDS.AWS_S3,
  'aws-s3': STORAGE_BACKENDS.AWS_S3,
  's3': STORAGE_BACKENDS.AWS_S3,
  'google cloud storage': STORAGE_BACKENDS.GCS,
  'gcs': STORAGE_BACKENDS.GCS,
  'azure blob storage': STORAGE_BACKENDS.AZURE,
  'azure': STORAGE_BACKENDS.AZURE,
  'ssh': STORAGE_BACKENDS.SSH,
  'sftp': STORAGE_BACKENDS.SSH,
  'ftp': STORAGE_BACKENDS.FTP,
  'ftps': STORAGE_BACKENDS.FTP,
  'samba': STORAGE_BACKENDS.SAMBA,
  'smb': STORAGE_BACKENDS.SAMBA,
  'nfs': STORAGE_BACKENDS.NFS,
};

// Required parameters per storage backend
const STORAGE_REQUIRED_PARAMS = {
  [STORAGE_BACKENDS.LOCAL]: ['savePath'],
  [STORAGE_BACKENDS.AWS_S3]: ['awsBucket', 'awsRegion'],
  [STORAGE_BACKENDS.GCS]: ['gcsBucket'],
  [STORAGE_BACKENDS.AZURE]: ['azureConnectionString', 'azureContainer'],
  [STORAGE_BACKENDS.SSH]: ['sshHost', 'sshUsername', 'sshPath', 'identityFile'],
  [STORAGE_BACKENDS.FTP]: ['ftpHost', 'ftpUsername', 'ftpPassword', 'ftpPath'],
  [STORAGE_BACKENDS.SAMBA]: ['smbHost', 'smbShare'],
  [STORAGE_BACKENDS.NFS]: ['nfsMountPath'],
};

// Optional parameters per storage backend
const STORAGE_OPTIONAL_PARAMS = {
  [STORAGE_BACKENDS.LOCAL]: [],
  [STORAGE_BACKENDS.AWS_S3]: ['awsAccessKeyId', 'awsSecretAccessKey', 'awsSessionToken', 'awsEndpoint', 'awsForcePathStyle'],
  [STORAGE_BACKENDS.GCS]: ['gcsKeyFile', 'gcsProjectId'],
  [STORAGE_BACKENDS.AZURE]: ['azureAccountName', 'azureAccountKey'],
  [STORAGE_BACKENDS.SSH]: ['sshPort', 'sshPassword'],
  [STORAGE_BACKENDS.FTP]: ['ftpPort', 'ftpSecure', 'ftpSecureOptions'],
  [STORAGE_BACKENDS.SAMBA]: ['smbUsername', 'smbPassword', 'smbDomain', 'smbPort'],
  [STORAGE_BACKENDS.NFS]: [],
};

// Whether the storage requires an identity file (SSH key)
const STORAGE_REQUIRES_IDENTITY = {
  [STORAGE_BACKENDS.LOCAL]: false,
  [STORAGE_BACKENDS.AWS_S3]: false,
  [STORAGE_BACKENDS.GCS]: false,
  [STORAGE_BACKENDS.AZURE]: false,
  [STORAGE_BACKENDS.SSH]: true,
  [STORAGE_BACKENDS.FTP]: false,
  [STORAGE_BACKENDS.SAMBA]: false,
  [STORAGE_BACKENDS.NFS]: false,
};

module.exports = {
  STORAGE_BACKENDS,
  STORAGE_ALIASES,
  STORAGE_REQUIRED_PARAMS,
  STORAGE_OPTIONAL_PARAMS,
  STORAGE_REQUIRES_IDENTITY,
};
