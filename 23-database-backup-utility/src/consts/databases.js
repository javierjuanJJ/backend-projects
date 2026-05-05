// src/consts/databases.js
// Supported DBMS definitions and their capabilities

const DBMS = {
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  MONGODB: 'mongodb',
  SQLITE: 'sqlite',
};

const BACKUP_TYPES = {
  FULL: 'full',
  INCREMENTAL: 'incremental',
  DIFFERENTIAL: 'differential',
};

// Defines which backup types are supported per DBMS
const DBMS_BACKUP_TYPE_SUPPORT = {
  [DBMS.MYSQL]: [BACKUP_TYPES.FULL, BACKUP_TYPES.INCREMENTAL, BACKUP_TYPES.DIFFERENTIAL],
  [DBMS.POSTGRESQL]: [BACKUP_TYPES.FULL, BACKUP_TYPES.INCREMENTAL, BACKUP_TYPES.DIFFERENTIAL],
  [DBMS.MONGODB]: [BACKUP_TYPES.FULL, BACKUP_TYPES.INCREMENTAL],
  [DBMS.SQLITE]: [BACKUP_TYPES.FULL],
};

// Defines which DBMS support table-level filtering
const DBMS_TABLE_SUPPORT = {
  [DBMS.MYSQL]: true,
  [DBMS.POSTGRESQL]: true,
  [DBMS.MONGODB]: false,
  [DBMS.SQLITE]: true,
};

// Defines which DBMS support collection-level filtering
const DBMS_COLLECTION_SUPPORT = {
  [DBMS.MYSQL]: false,
  [DBMS.POSTGRESQL]: false,
  [DBMS.MONGODB]: true,
  [DBMS.SQLITE]: false,
};

// Default ports per DBMS
const DBMS_DEFAULT_PORTS = {
  [DBMS.MYSQL]: 3306,
  [DBMS.POSTGRESQL]: 5432,
  [DBMS.MONGODB]: 27017,
  [DBMS.SQLITE]: null,
};

// CLI tools required per DBMS
const DBMS_REQUIRED_TOOLS = {
  [DBMS.MYSQL]: ['mysqldump', 'mysql'],
  [DBMS.POSTGRESQL]: ['pg_dump', 'pg_restore', 'psql'],
  [DBMS.MONGODB]: ['mongodump', 'mongorestore'],
  [DBMS.SQLITE]: ['sqlite3'],
};

// File extensions per DBMS
const DBMS_FILE_EXTENSIONS = {
  [DBMS.MYSQL]: '.sql',
  [DBMS.POSTGRESQL]: '.dump',
  [DBMS.MONGODB]: '',
  [DBMS.SQLITE]: '.db',
};

module.exports = {
  DBMS,
  BACKUP_TYPES,
  DBMS_BACKUP_TYPE_SUPPORT,
  DBMS_TABLE_SUPPORT,
  DBMS_COLLECTION_SUPPORT,
  DBMS_DEFAULT_PORTS,
  DBMS_REQUIRED_TOOLS,
  DBMS_FILE_EXTENSIONS,
};
