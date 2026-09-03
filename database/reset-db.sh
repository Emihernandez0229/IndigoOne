set -e 

DB_NAME="indigoone"
DB_USER="postgres"

echo "Eliminando base de datos '$DB_NAME' si existe..."
psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Creando base de datos '$DB_NAME'..."
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

echo "Aplicando schema.sql..."
psql -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/schema.sql"

if [ -f "$(dirname "$0")/seeds.sql" ]; then
    echo "Aplicando seeds.sql..."
    psql -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/seeds.sql"
fi

echo "Listo. Base de datos '$DB_NAME' recreada desde cero."