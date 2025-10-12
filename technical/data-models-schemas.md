# Data Models & Schemas

**Project:** techledger  
**Last Updated:** 2025-10-11

## Database Schema

### Entity 1: [Name]
```sql
CREATE TABLE entity1 (
    id SERIAL PRIMARY KEY,
    field1 VARCHAR(255) NOT NULL,
    field2 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Primary key
- `field1`: Description
- `field2`: Description

### Entity 2: [Name]
[Schema definition]

## Relationships
```
Entity1 ─(1:N)─ Entity2
Entity2 ─(N:M)─ Entity3
```

## Data Types & Formats

### JSON Structures
```json
{
    "example": {
        "field1": "value",
        "field2": 123
    }
}
```

## Validation Rules
- Field1: [validation rules]
- Field2: [validation rules]

## Indexes
- [ ] Index on field1 for performance
- [ ] Composite index on (field2, field3)

## Data Migration Strategy
[How to handle schema changes]
