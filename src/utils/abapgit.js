/**
 * Converts GitHub/abapGit URLs to ADT (ABAP Development Tools) deep links.
 * 
 * This module handles the complex mapping between abapGit file naming conventions
 * and ADT URI schemes, supporting various ABAP object types and their include files.
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Extension to ADT path mapping.
 * 
 * Extensions are matched longest-first to handle multi-part extensions correctly.
 * For example, '.ddls.asddls' must match before '.asddls' to avoid false positives.
 */
const EXTENSION_TO_ADT_PATH = Object.freeze({
  // Object-oriented ABAP
  '.clas.abap': 'sap/bc/adt/oo/classes',
  '.clas.locals_imp.abap': 'sap/bc/adt/oo/classes',
  '.clas.locals_def.abap': 'sap/bc/adt/oo/classes',
  '.clas.testclasses.abap': 'sap/bc/adt/oo/classes',
  '.intf.abap': 'sap/bc/adt/oo/interfaces',
  '.intf.locals_def.abap': 'sap/bc/adt/oo/interfaces',
  
  // Programs
  '.prog.abap': 'sap/bc/adt/programs/programs',
  
  // Function groups and function modules
  '.fugr.abap': 'sap/bc/adt/functions/groups',
  '.func.abap': 'sap/bc/adt/functions',
  
  // Data Dictionary objects (ABAP format)
  '.tabl.abap': 'sap/bc/adt/ddic/tables',
  '.dtel.abap': 'sap/bc/adt/ddic/dataelements',
  '.doma.abap': 'sap/bc/adt/ddic/domains',
  '.view.abap': 'sap/bc/adt/ddic/views',
  '.ttyp.abap': 'sap/bc/adt/ddic/tabletypes',
  
  // Data Dictionary objects (XML format)
  '.tabl.xml': 'sap/bc/adt/ddic/tables',
  '.dtel.xml': 'sap/bc/adt/ddic/dataelements',
  '.dtel.apis.xml': 'sap/bc/adt/ddic/dataelements',
  '.doma.xml': 'sap/bc/adt/ddic/domains',
  '.view.xml': 'sap/bc/adt/ddic/views',
  '.ttyp.xml': 'sap/bc/adt/ddic/tabletypes',
  '.enqu.xml': 'sap/bc/adt/ddic/lockobjects/sources',
  '.msag.xml': 'sap/bc/adt/messageclass',
  
  // CDS Views (DDL Sources)
  '.ddls.asddls': 'sap/bc/adt/ddic/ddl/sources',
  '.ddls.baseinfo': 'sap/bc/adt/ddic/ddl/sources',
  '.ddls.xml': 'sap/bc/adt/ddic/ddl/sources',
  
  // DDLX Sources (Data Definition Language Extensions)
  '.ddlx.asddlxs': 'sap/bc/adt/ddic/ddlx/sources',
  '.ddlx.xml': 'sap/bc/adt/ddic/ddlx/sources',
  
  // DRTY Sources (Data Retrieval Type)
  '.drty.acds': 'sap/bc/adt/ddic/drty/sources',
  '.drty.json': 'sap/bc/adt/ddic/drty/sources',
  
  // DTEB Sources (Data Type Extension Base)
  '.dteb.acds': 'sap/bc/adt/ddic/dteb/sources',
  '.dteb.json': 'sap/bc/adt/ddic/dteb/sources',
  
  // Application Log Objects
  '.aplo.json': 'sap/bc/adt/applicationlog/objects',
  
  // Application Job Catalogs
  '.sajc.json': 'sap/bc/adt/applicationjob/catalogs',
  
  // Application Job Templates
  '.sajt.json': 'sap/bc/adt/applicationjob/templates',
  
  // Authorization Objects
  '.auth.xml': 'sap/bc/adt/aps/iam/auth',
  
  // Behavior Definitions
  '.bdef.asbdef': 'sap/bc/adt/bo/behaviordefinitions',
  '.bdef.xml': 'sap/bc/adt/bo/behaviordefinitions',
  
  // Change Documents
  '.chdo.xml': 'sap/bc/adt/changedocuments/objects',
  
  // Packages
  '.devc.xml': 'sap/bc/adt/packages',
  
  // DCL Sources (Access Control Management)
  '.dcls.asdcls': 'sap/bc/adt/acm/dcl/sources',
  '.dcls.xml': 'sap/bc/adt/acm/dcl/sources',
  
  // HTTP Services
  '.http.xml': 'sap/bc/adt/ucon/httpservices',
  
  // Business Services
  '.srvb.xml': 'sap/bc/adt/businessservices/bindings',
  
  // Service Definitions
  '.srvd.srvdsrv': 'sap/bc/adt/ddic/srvd/sources',
  '.srvd.xml': 'sap/bc/adt/ddic/srvd/sources',
  
  // XSLT Transformations
  '.xslt.source.xml': 'sap/bc/adt/xslt/transformations',
  '.xslt.xml': 'sap/bc/adt/xslt/transformations',
  
  // Enhancements
  '.enho.abap': 'sap/bc/adt/enhancements/enhancements',
  '.enhs.abap': 'sap/bc/adt/enhancements/enhancements',
  '.enho.xml': 'sap/bc/adt/enhancements/enhancements',
  '.enhs.xml': 'sap/bc/adt/enhancements/enhancements',
  
  // Other object types
  '.clas.xml': 'sap/bc/adt/oo/classes',
  '.intf.xml': 'sap/bc/adt/oo/interfaces',
  
  // SAP Cloud Objects (SCO)
  '.sco1.xml': 'sap/bc/adt/aps/cloud/com/sco1',
  '.sco2.xml': 'sap/bc/adt/aps/cloud/com/sco2',
  '.sco3.xml': 'sap/bc/adt/aps/cloud/com/sco3',
  
  // SAP Identity and Access Management (SIA)
  '.sia1.xml': 'sap/bc/adt/aps/cloud/iam/sia1',
  '.sia2.xml': 'sap/bc/adt/aps/cloud/iam/sia2',
  '.sia3.xml': 'sap/bc/adt/aps/iam/suso',
  '.sia5.xml': 'sap/bc/adt/aps/cloud/iam/sia5',
  '.sia6.xml': 'sap/bc/adt/aps/cloud/iam/sia6',
  '.sia7.xml': 'sap/bc/adt/aps/cloud/iam/sia7',
  '.sush.xml': 'sap/bc/adt/aps/iam/sush',
  '.suso.xml': 'sap/bc/adt/aps/iam/suso',
  
  // Documentation (SKTD)
  '.sktd.xml': 'sap/bc/adt/documentation/ktd/documents',
})

/**
 * Include file type mappings.
 * 
 * These map to ADT include paths that differ from the standard object path.
 */
const INCLUDE_FILE_TYPES = Object.freeze({
  '.clas.locals_imp.abap': 'includes/implementations',
  '.clas.locals_def.abap': 'includes/definitions',
  '.clas.testclasses.abap': 'includes/testclasses',
  '.intf.locals_def.abap': 'includes/definitions',
})

// ============================================================================
// URL Parsing Utilities
// ============================================================================

/**
 * Parses a GitHub URL and extracts path components.
 * 
 * GitHub URLs follow the pattern: /owner/repo/blob/commit/path/to/file
 * We need to extract everything after the commit hash.
 */
class GitHubUrlParser {
  constructor(url) {
    this.url = new URL(url)
    this.pathParts = this.url.pathname.split('/').filter(Boolean)
  }

  /**
   * Validates that this is a valid GitHub blob URL.
   */
  validate() {
    const blobIndex = this.pathParts.indexOf('blob')
    if (blobIndex === -1 || blobIndex === this.pathParts.length - 1) {
      throw new Error('Invalid GitHub URL format: missing or invalid blob path')
    }
    return true
  }

  /**
   * Extracts the file path segments after the commit hash.
   * 
   * The commit hash is at blobIndex + 1, so we start from blobIndex + 2.
   */
  getFilePathParts() {
    this.validate()
    const blobIndex = this.pathParts.indexOf('blob')
    return this.pathParts.slice(blobIndex + 2)
  }

  /**
   * Gets the filename (last path segment).
   */
  getFilename() {
    const parts = this.getFilePathParts()
    return parts[parts.length - 1]
  }

  /**
   * Gets the decoded filename.
   */
  getDecodedFilename() {
    return decodeURIComponent(this.getFilename())
  }

  /**
   * Gets the folder name containing the file (second-to-last segment).
   */
  getFolderName() {
    const parts = this.getFilePathParts()
    if (parts.length < 2) {
      return null
    }
    return decodeURIComponent(parts[parts.length - 2])
  }

  /**
   * Gets the URL hash fragment (for line numbers).
   */
  getHash() {
    return this.url.hash
  }
}

// ============================================================================
// Extension Matching
// ============================================================================

/**
 * Finds the matching extension for a filename.
 * 
 * Returns extensions sorted by length (longest first) to ensure multi-part
 * extensions match before their shorter prefixes.
 */
function getSortedExtensions() {
  return Object.keys(EXTENSION_TO_ADT_PATH).sort((a, b) => b.length - a.length)
}

/**
 * Finds the ADT path for a given filename by matching its extension.
 */
function findExtensionMatch(filename) {
  const extensions = getSortedExtensions()
  return extensions.find(ext => filename.endsWith(ext))
}

/**
 * Removes the matched extension from a filename.
 * 
 * Uses the same longest-first matching to ensure correct removal.
 */
function removeExtension(filename) {
  const extensions = getSortedExtensions()
  
  for (const ext of extensions) {
    const escapedExt = ext.replace(/\./g, '\\.')
    const pattern = new RegExp(escapedExt + '$')
    if (pattern.test(filename)) {
      return filename.replace(pattern, '').trim()
    }
  }
  
  throw new Error(`No matching extension found for: ${filename}`)
}

// ============================================================================
// Object Name Parsing
// ============================================================================

/**
 * Parses package and object name from various ABAP naming conventions.
 * 
 * Supports:
 * - #package#object_name format (most common)
 * - (package)object_name format (for some object types)
 */
class ObjectNameParser {
  constructor(nameWithoutExt) {
    this.name = nameWithoutExt.trim()
  }

  /**
   * Parses (package)object_name format.
   * Used by some object types like application log objects.
   */
  parseParenFormat() {
    const match = this.name.match(/^\(([^)]+)\)(.+)$/)
    if (!match) return null
    
    return {
      package: match[1],
      object: match[2].trim()
    }
  }

  /**
   * Parses #package#object_name format.
   * This is the standard abapGit naming convention.
   */
  parseHashFormat() {
    const parts = this.name.split('#').filter(Boolean)
    if (parts.length < 2) {
      return null
    }
    
    return {
      package: parts[0],
      object: parts[parts.length - 1]
    }
  }

  /**
   * Parses the object name, trying both formats.
   */
  parse() {
    return this.parseParenFormat() || this.parseHashFormat()
  }
}

/**
 * Encodes an ADT path by converting forward slashes to %2f.
 * 
 * ADT URIs require forward slashes in paths to be URL-encoded.
 */
function encodeAdtPath(path) {
  return path.replace(/\//g, '%2f')
}

// ============================================================================
// Special Case Handlers
// ============================================================================

/**
 * Handles package.devc.xml files.
 * 
 * These files represent packages, not objects. The package path is derived
 * from the folder name, not the filename.
 */
function handlePackageFile(parser) {
  const filename = parser.getDecodedFilename()
  if (filename.toLowerCase() !== 'package.devc.xml') {
    return null
  }

  const folderName = parser.getFolderName()
  if (!folderName) {
    throw new Error('package.devc.xml must be in a folder')
  }

  // Convert #package#subpackage format to /package/subpackage
  const packageParts = folderName.split('#').filter(Boolean)
  if (packageParts.length === 0) {
    throw new Error('Invalid package folder format')
  }

  const packagePath = '/' + packageParts.join('/')
  return encodeAdtPath(packagePath)
}

/**
 * Handles include files (locals_imp, locals_def, testclasses).
 * 
 * These map to special ADT include paths that differ from standard objects.
 */
function handleIncludeFile(filename, nameWithoutExt) {
  const includeType = Object.keys(INCLUDE_FILE_TYPES).find(
    ext => filename.toLowerCase().endsWith(ext.toLowerCase())
  )
  
  if (!includeType) {
    return null
  }

  const parser = new ObjectNameParser(nameWithoutExt)
  const parsed = parser.parse()
  if (!parsed) {
    throw new Error('Invalid include file name format')
  }

  const includePath = INCLUDE_FILE_TYPES[includeType]
  const encodedPart = encodeAdtPath(`/${parsed.package}/${parsed.object}`)
  return `${encodedPart}/${includePath}`
}

/**
 * Handles .sush.xml files.
 * 
 * These use the filename directly as the object name without package prefix.
 */
function handleSushFile(filename, nameWithoutExt) {
  if (!filename.toLowerCase().endsWith('.sush.xml')) {
    return null
  }
  
  // Return object name directly without encoding
  return nameWithoutExt
}

// ============================================================================
// ADT Path Resolution
// ============================================================================

/**
 * Determines the ADT path for a GitHub URL.
 */
function getAdtPath(url) {
  const parser = new GitHubUrlParser(url)
  const filename = parser.getDecodedFilename()
  const extension = findExtensionMatch(filename)
  
  if (!extension) {
    throw new Error(`Unsupported file extension: ${filename}`)
  }
  
  return EXTENSION_TO_ADT_PATH[extension]
}

/**
 * Determines the ADT object path for a GitHub URL.
 * 
 * Handles various special cases before falling back to standard parsing.
 */
function getAdtObject(url) {
  const parser = new GitHubUrlParser(url)
  const filename = parser.getDecodedFilename()
  
  // Special case: package files
  const packagePath = handlePackageFile(parser)
  if (packagePath) {
    return packagePath
  }
  
  // Remove extension to get base name
  const nameWithoutExt = removeExtension(filename)
  
  // Special case: include files
  const includePath = handleIncludeFile(filename, nameWithoutExt)
  if (includePath) {
    return includePath
  }
  
  // Special case: .sush.xml files
  const sushPath = handleSushFile(filename, nameWithoutExt)
  if (sushPath) {
    return sushPath
  }
  
  // Standard parsing
  const nameParser = new ObjectNameParser(nameWithoutExt)
  const parsed = nameParser.parse()
  
  if (!parsed) {
    throw new Error(`Invalid object name format: ${nameWithoutExt}`)
  }
  
  const adtPath = `/${parsed.package}/${parsed.object}`
  return encodeAdtPath(adtPath)
}

// ============================================================================
// Line Number Handling
// ============================================================================

/**
 * Converts GitHub line number hash to ADT format.
 * 
 * GitHub uses #L9 or #L10-L20 format, ADT uses #start=9 or #start=10&end=20.
 */
function getAdtLineNumber(url) {
  const parser = new GitHubUrlParser(url)
  const hash = parser.getHash()
  
  if (!hash) {
    return ''
  }
  
  // Single line: #L9
  const singleLineMatch = hash.match(/^#L(\d+)$/)
  if (singleLineMatch) {
    const line = parseInt(singleLineMatch[1], 10)
    return `#start=${line}`
  }
  
  // Range: #L10-L20 or #L10-20
  const rangeMatch = hash.match(/^#L(\d+)-L?(\d+)$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10)
    const end = parseInt(rangeMatch[2], 10)
    
    // Validate range
    if (start && end && end >= start) {
      return `#start=${start}&end=${end}`
    }
    
    // Fallback to start line if range is invalid
    if (start) {
      return `#start=${start}`
    }
  }
  
  return ''
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Builds an ADT deep link from a GitHub URL.
 * 
 * @param {string} url - GitHub/abapGit URL
 * @param {string} adtSystem - ADT system name (e.g., 'DCL')
 * @returns {string} ADT deep link (e.g., 'adt://DCL/sap/bc/adt/oo/classes/...')
 */
export function buildAdtHref(url, adtSystem) {
  const adtPath = getAdtPath(url)
  const adtObject = getAdtObject(url)
  const baseLink = `adt://${adtSystem}/${adtPath}/${adtObject}`
  
  const lineNumber = getAdtLineNumber(url)
  return lineNumber ? baseLink + lineNumber : baseLink
}
