"""
Data migration to preserve manager_position data before schema change.
This script moves existing single manager to the new many-to-many relationship.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from organization.models import Position

def migrate_manager_data():
    """Migrate old manager_position data to new manager_positions M2M field"""
    print("Starting migration of manager_position data...")
    
    # First, let's check if the old field still exists by querying raw
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(organization_position)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'manager_position_id' not in columns:
            print("manager_position_id field not found - migration may have already run")
            return
    
    # Query positions with old manager_position field
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT id, manager_position_id 
            FROM organization_position 
            WHERE manager_position_id IS NOT NULL
        """)
        positions_with_managers = cursor.fetchall()
    
    print(f"Found {len(positions_with_managers)} positions with managers")
    
    # For each position, add the manager to the new M2M field
    migrated = 0
    for pos_id, manager_id in positions_with_managers:
        try:
            position = Position.objects.get(id=pos_id)
            manager = Position.objects.get(id=manager_id)
            position.manager_positions.add(manager)
            migrated += 1
            print(f"  Migrated: Position {pos_id} → Manager {manager_id}")
        except Position.DoesNotExist:
            print(f"  Skipped: Position or manager not found (pos={pos_id}, manager={manager_id})")
        except Exception as e:
            print(f"  Error migrating position {pos_id}: {e}")
    
    print(f"\nMigration complete: {migrated}/{len(positions_with_managers)} positions migrated")

if __name__ == "__main__":
    migrate_manager_data()
