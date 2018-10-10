#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "DeskerPamStagingApp-group" ]
then
  cd /api-staging-efs/node/staging_desker_pam_api/
  mode=pam pm2 reload startPamProcesses.yml
else    
  echo "Unknown deployment Group"
fi
