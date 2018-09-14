#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "Development_DeskerMobileApiApp-Group" ]
then
  cd /api-staging-efs/node/development_desker_api/
  mode=dev pm2 reload development_startStagProcesses.yml
else    
  echo "Unknown deployment Group"
fi
