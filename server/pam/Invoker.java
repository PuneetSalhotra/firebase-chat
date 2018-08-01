import java.sql.Connection;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.TreeMap;


public class Invoker {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		
		Connection con = null;
		DBConnection dbcon = new DBConnection();
		con = dbcon.getMasterConnection();
		
		long idActivity = 0;
		
		ArrayList<Long> tables = new ArrayList<Long>();
		
		long idEvent = Long.parseLong(args[0]);//58081;
		int requiredCapacity = Integer.parseInt(args[1]); //6; 
		long idMember = Long.parseLong(args[2]);
		String memberName = args[3];
		String countryCode = args[4];
		String phoneNumber = args[5];
		//58081 8 10504 Sravan 91 9010819966
		//System.out.println("idActivity: "+idActivity);
		try{
		tables = getOptimalMatch(requiredCapacity, idEvent, con);
		}catch(Exception e){
			
		}
		//System.out.println();
		//System.out.println("TABLES "+tables.size());
		
		if(tables.size() > 0)
		{
			String authToken = "40972200-f5bd-11e7-998f-876a9ef448ff";
			
			HashMap<String, String> inlineData = new HashMap<String, String>();
			inlineData.put("country_code",countryCode);
			inlineData.put("phone_number",phoneNumber);
			inlineData.put("party_size",""+requiredCapacity);
			
			long idAsset = 11031;
		    long idOrganization = 351;
		    long idAccount = 452;
		    long idWorkforce = 2085;
		    long idActivityType = 51728;
		    int idActivityTypeCategory = 37;
		    String activityStartDatetime = Utils.CurrentDatetimeUTC();
		    String activityEndDatetime = Utils.CurrentDatetimeUTC();
		    
			idActivity = Activity.createActivity(
					authToken,
					memberName+"_"+phoneNumber,
					inlineData,
					idAsset,
					idOrganization,
					idAccount,
					idWorkforce,
					idActivityType,
					idActivityTypeCategory,
					activityStartDatetime,
					activityEndDatetime,
					0, //SubTypeId
					"", // SubTypeName
					92173, //idActivityStatus,
					117, //idAssetRole,
					0, //channelActivityId,
					0, //channelActivityCategoryId,
					idEvent //parentActivityId
					);
			
			//System.out.println("idActivity : "+idActivity);
			
			AssignParticipant ap = new AssignParticipant();
			HashMap<String, String> participantCollection = new HashMap<String, String>();
			
			
			participantCollection.put("organization_id", ""+idOrganization);
			participantCollection.put("account_id", ""+idAccount);
			participantCollection.put("workforce_id", ""+idWorkforce);
			participantCollection.put("asset_type_id", ""+38398);
			participantCollection.put("asset_id", ""+idMember);
			participantCollection.put("access_role_id", ""+118);
			participantCollection.put("message_unique_id", Utils.getMessageUniqueId(idAsset));
			
			ap.assignParticipant(idOrganization, idAccount, idWorkforce, idAsset, idActivity, authToken, idActivityType, idActivityTypeCategory, 117, participantCollection, "", 0);
			
			
			//ArrayList<HashMap<String, String>> al = new ArrayList<HashMap<String, String>>();
			
			for(int i = 0; i < tables.size(); i++)
			{				
				HashMap<String, String> collection = new HashMap<String, String>();
				collection.put("organization_id", ""+idOrganization);
				collection.put("account_id", ""+idAccount);
				collection.put("workforce_id", ""+2034);
				collection.put("asset_type_id", ""+36869);
				collection.put("asset_id", ""+tables.get(i));
				collection.put("access_role_id", ""+118);
				collection.put("message_unique_id", Utils.getMessageUniqueId(tables.get(i)));
				
				ap.assignParticipant(idOrganization, idAccount, idWorkforce, idAsset, idActivity, authToken, idActivityType, idActivityTypeCategory, 117, collection, "", 0);
			}
		}else{
			
		}
		
		System.out.println(idActivity);
	    dbcon.closeConnection(con);
		
	}
	
	public static ArrayList<Long> getOptimalMatch(int requiredCapacity, long idEvent, Connection con){
		
		ArrayList<Long> tableList = new ArrayList<Long>();

		TreeMap<String,TreeMap<String, String>> all_table_details = Reservation.getAllTableDetails(idEvent, con);
		
		//TreeMap<String, String> assetIdNameMap = all_table_details.get("assetIdNameMap");
		TreeMap<String, String> nameAssetIdMap = all_table_details.get("nameAssetIdMap");
		//TreeMap<String, String> assetIdNameMapReserved = all_table_details.get("assetIdNameMapReserved");
		TreeMap<String, String> nameAssetIdMapReserved = all_table_details.get("nameAssetIdMapReserved");
		
		HashMap<String,String> finalObject= new HashMap<String,String>();
       
        int capacityMap_A[] = {6};
        int edgeMap_A[] = {0};
        int distanceMap_A[][] =
        {
            {0}            
        };
        
        PAMTableAllocation pta = new PAMTableAllocation();
        
        finalObject = pta.print_nCr(nameAssetIdMapReserved, "A",requiredCapacity, capacityMap_A, edgeMap_A, distanceMap_A, 1, 1);
        
		int capacityMap_B[] = {4,4,2,2,2};
        int edgeMap_B[] = {3,3,2,4,2};
        int distanceMap_B[][] =
        {
            {0,1,1,2,3},
            {1,0,3,2,1},
            {1,3,0,1,3},
            {2,2,1,0,1},
            {3,1,3,1,0}
        };        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "B", requiredCapacity, capacityMap_B, edgeMap_B, distanceMap_B, 5, 1));
        //System.out.println();
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "B", requiredCapacity, capacityMap_B, edgeMap_B, distanceMap_B, 5, 2));
       // System.out.println();
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "B", requiredCapacity, capacityMap_B, edgeMap_B, distanceMap_B, 5, 3));
        //System.out.println();
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "B", requiredCapacity, capacityMap_B, edgeMap_B, distanceMap_B, 5, 4));
        //System.out.println();
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "B", requiredCapacity, capacityMap_B, edgeMap_B, distanceMap_B, 5, 5));
       //System.out.println();

       
        int capacityMap_C[] = {4,4,2,2,2};
        int edgeMap_C[] = {3,3,2,4,2};
        int distanceMap_C[][] =
        {
            {0,1,1,2,3},
            {1,0,3,2,1},
            {1,3,0,1,3},
            {2,2,1,0,1},
            {3,1,3,1,0}
        };
        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "C", requiredCapacity, capacityMap_C, edgeMap_C, distanceMap_C, 5, 1));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "C", requiredCapacity, capacityMap_C, edgeMap_C, distanceMap_C, 5, 2));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "C", requiredCapacity, capacityMap_C, edgeMap_C, distanceMap_C, 5, 3));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "C", requiredCapacity, capacityMap_C, edgeMap_C, distanceMap_C, 5, 4));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "C", requiredCapacity, capacityMap_C, edgeMap_C, distanceMap_C, 5, 5));

        int capacityMap_D[] = {4,4,2,2,2};
        int edgeMap_D[] = {3,3,2,4,2};
        int distanceMap_D[][] =
        {
            {0,1,1,2,3},
            {1,0,3,2,1},
            {1,3,0,1,3},
            {2,2,1,0,1},
            {3,1,3,1,0}
        };
        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "D", requiredCapacity, capacityMap_D, edgeMap_D, distanceMap_D, 5, 1));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "D", requiredCapacity, capacityMap_D, edgeMap_D, distanceMap_D, 5, 2));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "D", requiredCapacity, capacityMap_D, edgeMap_D, distanceMap_D, 5, 3));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "D", requiredCapacity, capacityMap_D, edgeMap_D, distanceMap_D, 5, 4));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "D", requiredCapacity, capacityMap_D, edgeMap_D, distanceMap_D, 5, 5));

		
        int capacityMap_E[] = {3,5};
        int edgeMap_E[] = {1,1};
        int distanceMap_E[][] =
        {
    		{0,1},
            {1,0} 
        };
        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "E", requiredCapacity, capacityMap_E, edgeMap_E, distanceMap_E, 2, 1));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "E", requiredCapacity, capacityMap_E, edgeMap_E, distanceMap_E, 2, 2));

        
        int capacityMap_F[] = {3,5};
        int edgeMap_F[] = {1,1};
        int distanceMap_F[][] =
        {
    		{0,1},
            {1,0} 
        };
        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "F", requiredCapacity, capacityMap_F, edgeMap_F, distanceMap_F, 2, 1));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "F", requiredCapacity, capacityMap_F, edgeMap_F, distanceMap_F, 2, 2));

        
        int capacityMap_G[] = {3,5};
        int edgeMap_G[] = {1,1};
        int distanceMap_G[][] =
        {
    		{0,1},
            {1,0} 
        };
        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "G", requiredCapacity, capacityMap_G, edgeMap_G, distanceMap_G, 2, 1));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "G", requiredCapacity, capacityMap_G, edgeMap_G, distanceMap_G, 2, 2));
        
        
        int capacityMap_H[] = {3,5};
        int edgeMap_H[] = {1,1};
        int distanceMap_H[][] =
        {
            {0,1},
            {1,0}            
        };
        
        
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "H", requiredCapacity, capacityMap_H, edgeMap_H, distanceMap_H, 2, 1));
        finalObject = checkAndOverride(finalObject, pta.print_nCr(nameAssetIdMapReserved, "H", requiredCapacity, capacityMap_H, edgeMap_H, distanceMap_H, 2, 2));
		
        String[] tablesNames = {};

        if(finalObject.size() > 0)
        	tablesNames = finalObject.get("combinataion").substring(1, finalObject.get("combinataion").length()).split("-");
        
        //System.out.println();
        
        for(int i = 0; i <= (tablesNames.length - 1); i++){ 
        	//System.out.println("TABLE NAME "+tablesNames[i]);
        	tableList.add(Long.parseLong(nameAssetIdMap.get(tablesNames[i])));
        }

        return tableList;
	}
	
	public static HashMap<String,String> checkAndOverride(HashMap<String,String> finalObject, HashMap<String,String> currentObject)
	{
		
		if(finalObject.size() == 0 && currentObject.size() > 0)	
			return currentObject;
		else if(currentObject.size() == 0 && finalObject.size() > 0)
			return finalObject;
		else if(currentObject.size() == 0 && finalObject.size()== 0)
			return finalObject;
		else if(currentObject.size() > 0 && finalObject.size()> 0){
		
		boolean isOverride = false;
		
        if(Integer.parseInt(finalObject.get("finalScore")) > Integer.parseInt(currentObject.get("finalScore"))){                	

        	isOverride = true;        	
        	
        }else if(Integer.parseInt(finalObject.get("finalScore")) == Integer.parseInt(currentObject.get("finalScore")))
        {
        	if(Integer.parseInt(finalObject.get("tempUnusedCapacity")) > Integer.parseInt(currentObject.get("tempUnusedCapacity")))
        	{
        		isOverride = true;        		
            	
        	}else if(Integer.parseInt(finalObject.get("tempDistanceCalculation")) > Integer.parseInt(currentObject.get("tempDistanceCalculation")))
        	{              
        		isOverride = true;
        		
        	}
        }		
        
        if(isOverride)
        {
        	finalObject.put("combinataion",currentObject.get("combinataion"));
        	finalObject.put("finalScore",""+currentObject.get("finalScore"));
        	finalObject.put("tempUnusedCapacity",""+currentObject.get("tempUnusedCapacity"));
        	finalObject.put("tempDistanceCalculation",""+currentObject.get("tempDistanceCalculation"));
        }
		}
       // System.out.println("IN METHOD  "+finalObject);
        return finalObject;
	}

}
