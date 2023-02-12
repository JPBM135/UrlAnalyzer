echo "||  _    _      _                        _                     ||"
echo "|| | |  | |    | |     /\               | |                    ||"
echo "|| | |  | |_ __| |    /  \   _ __   __ _| |_   _ _______ _ __  ||"
echo "|| | |  | | '__| |   / /\ \ | '_ \ / _\` | | | | |_  / _ \ '__| ||"
echo "|| | |__| | |  | |  / ____ \| | | | (_| | | |_| |/ /  __/ |    ||"
echo "||  \____/|_|  |_| /_/    \_\_| |_|\__,_|_|\__, /___\___|_|    ||"
echo "||                                         __/ |               ||"
echo "||                                        |___/                ||"

echo "Starting the app..."
echo "======================================================================"
echo "[YARN] Installing dependencies..."
yarn --immutable
echo "[YARN] Dependencies installed"

echo "======================================================================"

echo "[DOCKER]: Starting the database..."
docker-compose up -d
echo "[DOCKER]: Database started"

echo "======================================================================"

echo "[API]: building..."
cd packages/api
yarn build
echo "[API]: Builded"

echo "======================================================================"

echo "[WEB]: building..."
cd ../client
yarn build
echo "[WEB]: Builded"

echo "======================================================================"

echo "[OPEN-SSL]: Generating certificates..."
echo "Click enter on all options to finish"
cd ../..
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout example.key -out example.crt -subj
echo "[OPEN-SSL]: Certificates generated"

echo "======================================================================"
