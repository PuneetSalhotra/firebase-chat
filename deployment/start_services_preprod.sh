#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "tempdeploy-Group" ]
then
  pm2 delete all
  cd /preprod_desker_api/
  pm2 start preProdProcesses.yml  
  pm2 stop PreProd_ConsumerZero
  pm2 stop PreProd_Log_ConsumerZero
  pm2 stop PreProd_Widget_ConsumerZero
  cd /preprod_portal_api/portal
  pm2 start preProdPortalProcesses.yml  
else    
  echo "Unknown deployment Group"
fi