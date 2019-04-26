#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "preProdCodeDeploy-Group" ]
then
  cd /preprod_desker_api/
  pm2 reload preProdProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "tempdeploy-Group" ] 
then
  cd /preprod_desker_api/  
  pm2 start preProdProcesses.yml  
  pm2 stop PreProd_ConsumerZero
  pm2 stop PreProd_Log_ConsumerZero
  pm2 stop PreProd_Widget_ConsumerZero
  cd /preprod_portal_api/portal
  pm2 start preProdPortalProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "prodCodeDeploy-Group" ] 
then
  cd /production_desker_api/2018-11-28-02/
  pm2 start prodProcesses.yml
  #sleep 2
  #cd /production_portal_api/portal/
  #mode=prod pm2 start prodPortalProcesses.yml
else    
  echo "Unknown deployment Group"
fi
