import java.io.FileNotFoundException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.TreeMap;


public class Reservation {
	
	public static ArrayList<Long> getReservedTables(long idEvent, Connection con){
		
		//Connection con = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		
		ArrayList<Long> unreserved_tables = new ArrayList<Long>();
		
		DBConnection dbcon = new DBConnection();
		String UNRESERVED_TABLES = "CALL ds_v1_activity_asset_mapping_select_reserved_tables(351,"+idEvent+")";
		
		try
		{
			//con = dbcon.getMasterConnection();
			
			ps = con.prepareStatement(UNRESERVED_TABLES);
			rs = ps.executeQuery();
			
			while(rs.next())
			{
				unreserved_tables.add(rs.getLong("asset_id"));
			}		
			
			ps.close();
			rs.close();
			
		}catch(SQLException e){
			e.printStackTrace();
		}
		
		return unreserved_tables;
	}// End of the class
	
	public static TreeMap<String,TreeMap<String, String>> getAllTableDetails(long idEvent, Connection con){
		
		//Connection con = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		
		TreeMap<String,TreeMap<String, String>> all_tables_map = new TreeMap<String,TreeMap<String, String>>();
		
		TreeMap<String, String> assetIdNameMap = new TreeMap<String, String>();
		TreeMap<String, String> nameAssetIdMap = new TreeMap<String, String>();
		TreeMap<String, String> assetIdNameMapReserved = new TreeMap<String, String>();
		TreeMap<String, String> nameAssetIdMapReserved = new TreeMap<String, String>();
		
		ArrayList<Long> reserved_tables = new ArrayList<Long>();
		
		//DBConnection dbcon = new DBConnection();
		String ALL_TABLES = "SELECT asset_id, asset_first_name, asset_last_name, asset_description, asset_customer_unique_id, asset_type_category_id," +
				" asset_type_category_name" +
				" FROM asset_list" +
				" WHERE organization_id = 351" +
				" AND account_id = 452" +
				" AND asset_type_category_id = 31" +
				" AND log_state < 3" +
				" AND log_active = 1";        
		
		try
		{
			//con = dbcon.getMasterConnection();
			
			ps = con.prepareStatement(ALL_TABLES);
			rs = ps.executeQuery();
			
			while(rs.next())
			{
				
				assetIdNameMap.put(rs.getString("asset_id"), rs.getString("asset_customer_unique_id"));
				nameAssetIdMap.put(rs.getString("asset_customer_unique_id"), rs.getString("asset_id"));
				
			}	
			
			all_tables_map.put("assetIdNameMap", assetIdNameMap);
			all_tables_map.put("nameAssetIdMap", nameAssetIdMap);
			
			reserved_tables = getReservedTables(idEvent, con);
			
			//System.out.println(reserved_tables);
			
			for(int i = 0; i < reserved_tables.size(); i++)
			{
				assetIdNameMapReserved.put(""+reserved_tables.get(i), assetIdNameMap.get(""+reserved_tables.get(i)));
				nameAssetIdMapReserved.put(assetIdNameMap.get(""+reserved_tables.get(i)), ""+reserved_tables.get(i));
			}
			
			all_tables_map.put("assetIdNameMapReserved", assetIdNameMapReserved);
			all_tables_map.put("nameAssetIdMapReserved", nameAssetIdMapReserved);
			
			//System.out.println(assetIdNameMap);
			//System.out.println(nameAssetIdMap);
			//System.out.println(assetIdNameMapReserved);
			//System.out.println(nameAssetIdMapReserved);
			
			ps.close();
			rs.close();
			
		}catch(SQLException e){
			e.printStackTrace();
		}
		
		return all_tables_map;
	}

}
