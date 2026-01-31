# Catalog Management Feature

## Overview

The Catalog Management feature provides full CRUD (Create, Read, Update, Delete) operations for managing watsonx.data catalogs through an intuitive web interface. It includes advanced schema visualization and detailed table metadata viewing capabilities.

## Features

### 1. Catalog CRUD Operations

#### Create Catalog
- Support for multiple catalog types: Iceberg, Hive, Delta Lake
- Input validation for catalog names (alphanumeric, underscore, hyphen only)
- Optional description and properties
- Real-time feedback on creation success/failure

#### Read Catalogs
- List all available catalogs
- View detailed catalog information
- Get catalog statistics (schema count, table count)
- Browse hierarchical schema tree

#### Update Catalog
- Modify catalog description
- Update catalog properties
- Preserve catalog name and type (immutable)

#### Delete Catalog
- Confirmation dialog with warning
- Cascade deletion of schemas and tables
- Error handling for active catalogs

### 2. Schema Visualization

#### Hierarchical Tree View
- Expandable/collapsible schema nodes
- Visual indicators for schemas and tables
- Table count per schema
- Interactive navigation

#### Schema Browser
- Real-time schema loading
- Lazy loading for performance
- Error handling for inaccessible schemas
- Visual feedback during loading

### 3. Table Metadata Viewer

#### Detailed Column Information
- Column names and data types
- Nullable/Not Nullable indicators
- Column ordering
- Type information with proper formatting

#### Table Properties
- Storage format (Parquet, ORC, Avro)
- Location information
- Custom properties
- Metadata timestamps

#### Interactive Dialog
- Modal view for detailed metadata
- Tabular display of columns
- Property key-value pairs
- Easy-to-read formatting

## User Interface

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Catalog Management                    [Refresh] [Create]│
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│  Catalogs    │  Statistics                              │
│  ┌────────┐  │  ┌─────────────────────────────────────┐│
│  │ iceberg│  │  │ Schemas: 3    Tables: 15            ││
│  │ hive   │  │  └─────────────────────────────────────┘│
│  │ delta  │  │                                           │
│  └────────┘  │  Schema Browser                          │
│              │  ┌─────────────────────────────────────┐│
│              │  │ ▼ default (5 tables)                ││
│              │  │   ├─ customers         [Info]       ││
│              │  │   ├─ orders            [Info]       ││
│              │  │   └─ products          [Info]       ││
│              │  │ ▶ analytics (10 tables)             ││
│              │  └─────────────────────────────────────┘│
└──────────────┴──────────────────────────────────────────┘
```

### Key Components

1. **Catalog List** (Left Panel)
   - Scrollable list of catalogs
   - Edit and Delete buttons per catalog
   - Selection highlighting
   - Type badges

2. **Statistics Card** (Right Panel, Top)
   - Schema count
   - Table count
   - Catalog name badge

3. **Schema Browser** (Right Panel, Bottom)
   - Expandable schema tree
   - Table list per schema
   - Info button for metadata
   - Visual hierarchy

## API Endpoints

### Catalog Operations

```
GET    /api/catalog              # List all catalogs
GET    /api/catalog/:name        # Get catalog details
POST   /api/catalog              # Create catalog
PATCH  /api/catalog/:name        # Update catalog
DELETE /api/catalog/:name        # Delete catalog
```

### Metadata Operations

```
GET    /api/catalog/:name/stats                           # Get statistics
GET    /api/catalog/:name/tree                            # Get schema tree
GET    /api/catalog/:cat/schema/:sch/table/:tbl/metadata # Get table metadata
```

## Security Features

### Input Validation
- Catalog names validated against pattern: `^[a-zA-Z0-9_-]+$`
- SQL injection protection
- Path traversal prevention
- Type validation for all inputs

### Error Handling
- Graceful degradation on API failures
- User-friendly error messages
- Detailed logging for debugging
- Retry mechanisms for transient failures

## Usage Examples

### Creating a Catalog

1. Click "Create Catalog" button
2. Fill in the form:
   - Name: `my_catalog`
   - Type: `iceberg`
   - Description: `My data catalog`
3. Click "Create"
4. Catalog appears in the list

### Viewing Table Metadata

1. Select a catalog from the list
2. Expand a schema in the tree
3. Click the Info icon next to a table
4. View detailed metadata in dialog:
   - Column definitions
   - Data types
   - Nullable flags
   - Table properties

### Updating a Catalog

1. Click Edit icon next to catalog
2. Modify description or properties
3. Click "Update"
4. Changes are saved

### Deleting a Catalog

1. Click Delete icon next to catalog
2. Confirm deletion in dialog
3. Catalog is removed
4. All schemas and tables are deleted

## Best Practices

### Naming Conventions
- Use lowercase for catalog names
- Use underscores for word separation
- Keep names descriptive but concise
- Avoid special characters

### Organization
- Group related data in same catalog
- Use schemas for logical separation
- Document catalog purposes in descriptions
- Maintain consistent naming across catalogs

### Performance
- Limit number of catalogs (< 50 recommended)
- Use lazy loading for large schema trees
- Cache metadata when possible
- Monitor catalog statistics regularly

## Troubleshooting

### Common Issues

**Catalog creation fails**
- Check catalog name format
- Verify watsonx.data connectivity
- Ensure sufficient permissions
- Check for duplicate names

**Schema tree not loading**
- Verify catalog exists
- Check network connectivity
- Review browser console for errors
- Refresh the page

**Table metadata unavailable**
- Ensure table exists
- Check catalog permissions
- Verify schema access
- Review API logs

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid catalog name" | Name contains special characters | Use only alphanumeric, underscore, hyphen |
| "Catalog already exists" | Duplicate name | Choose a different name |
| "Failed to load schemas" | Network/API error | Check connectivity, retry |
| "Permission denied" | Insufficient access | Verify credentials |

## Future Enhancements

### Planned Features
- [ ] Catalog import/export
- [ ] Bulk operations
- [ ] Advanced search and filtering
- [ ] Catalog templates
- [ ] Version history
- [ ] Access control management
- [ ] Performance metrics per catalog
- [ ] Data lineage visualization

### Under Consideration
- [ ] Catalog cloning
- [ ] Schema comparison
- [ ] Automated catalog discovery
- [ ] Integration with data governance tools
- [ ] Custom metadata fields
- [ ] Catalog health monitoring

## Related Documentation

- [API Documentation](API.md) - Complete API reference
- [Architecture](ARCHITECTURE.md) - System architecture details
- [Quick Start Guide](QUICKSTART.md) - Getting started
- [Security Fixes](../SECURITY_FIXES.md) - Security enhancements

# Made with Bob