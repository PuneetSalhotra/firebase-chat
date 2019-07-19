#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "Development_DeskerMobileApiApp-Group" ]
then
  cd /staging_desker_api/
  pm2 stop all
  pm2 delete all
  pm2 start devProcesses.yml
else    
  echo "Unknown deployment Group"
fi
