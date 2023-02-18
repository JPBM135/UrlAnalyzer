echo "======================================================================"
echo "[Git]: Downloading the IOK ruleset..."
git clone https://github.com/phish-report/IOK.git ./data/cache
cd ./data/cache
echo "[Git]: Copying the IOK ruleset to the API..."
cp -r indicators/* ../iok
echo "[Git]: IOK ruleset downloaded"

echo "[Git]: Deleting cache..."
cd ..
rm -rf cache
echo "[Git]: Cache deleted"


echo "======================================================================"