import java.util.Arrays;
import java.util.HashMap;
import java.util.TreeMap;

public class PAMTableAllocation
{
    public static void main (String[] args)
    {
        System.out.println("Starting the allocation engine...");
        System.out.println();

      /*  print_nCr(5, 1);
        
        print_nCr(5, 2);
        print_nCr(5, 3);
        print_nCr(5, 4);
        print_nCr(5, 5);*/
    }

    public final HashMap<String,String> print_nCr(TreeMap<String, String> nameAssetIdMapReserved, String section, int requiredCapacity, int capacityMap[], int edgeMap[], int distanceMap[][], final int n, final int r)
    {
       
        int tempCombinationCapacity;
        boolean tempRequiredCapacityMet;
        int tempUnusedCapacity;
        int tempDistanceMap[];
        int tempDistanceCalculation;
        int finalScore = 1000;
        HashMap<String,String> optimalCombination = new HashMap<String,String>();
        
        int[] res = new int[r];

        for (int i = 0; i < res.length; i++)
        {
            res[i] = i + 1;
        }

        boolean done = false;

        while(!done)
        {
            //System.out.println(Arrays.toString(res));
        	
            tempCombinationCapacity = 0;
            tempRequiredCapacityMet = false;
            tempDistanceCalculation = 0;

            tempDistanceMap = distanceMap[res[0] - 1];
           // System.out.println("Distance Map: " + Arrays.toString(tempDistanceMap));
            
            boolean isCombinationTableReserved = false;
            
            String combinataion = "";
            
            for (int iterator = 0; iterator < res.length; iterator++)
            {
            	//System.out.println(section+res[iterator]);
            	combinataion = combinataion +"-"+section+res[iterator];
            	if(nameAssetIdMapReserved.containsKey(section+res[iterator])){
            		isCombinationTableReserved = true;
            	}else{
	                
	                tempCombinationCapacity = tempCombinationCapacity + capacityMap[res[iterator] - 1];
	
	                tempDistanceCalculation = tempDistanceCalculation + tempDistanceMap[res[iterator] - 1];
	
	                if(res.length == 1)
	                {
	                   // System.out.println("Edge Score: " + edgeMap[res[iterator] - 1]);
	                }
            	}
            }

            if(isCombinationTableReserved){
            	tempCombinationCapacity = 0;
            }
            
          //  System.out.println("Combination Capacity: " + tempCombinationCapacity);
          //  System.out.println("Distance Calculation: " + tempDistanceCalculation);

            tempRequiredCapacityMet = (requiredCapacity <= tempCombinationCapacity);
            //System.out.println("Required Capacity < Combination Capacity: " + tempRequiredCapacityMet);

            if (tempRequiredCapacityMet)
            {
            	//System.out.println("Combination Capacity: " + tempCombinationCapacity);
                //System.out.println("Distance Calculation: " + tempDistanceCalculation);
                
                tempUnusedCapacity = tempCombinationCapacity - requiredCapacity;
                //System.out.println("Unused Capacity: " + tempUnusedCapacity);
                //System.out.println("Score: " + (tempDistanceCalculation + tempUnusedCapacity));
                
                if(finalScore > (tempDistanceCalculation + tempUnusedCapacity)){                	

                	finalScore = tempDistanceCalculation + tempUnusedCapacity;
                	optimalCombination.put("combinataion",combinataion);
                	optimalCombination.put("finalScore",""+finalScore);
                	optimalCombination.put("tempUnusedCapacity",""+tempUnusedCapacity);
                	optimalCombination.put("tempDistanceCalculation",""+tempDistanceCalculation);
                	
                }else if(finalScore == (tempDistanceCalculation + tempUnusedCapacity))
                {
                	if(Integer.parseInt(optimalCombination.get("tempUnusedCapacity")) > tempUnusedCapacity)
                	{
                		finalScore = tempDistanceCalculation + tempUnusedCapacity;
                    	optimalCombination.put("combinataion",combinataion);
                    	optimalCombination.put("finalScore",""+finalScore);
                    	optimalCombination.put("tempUnusedCapacity",""+tempUnusedCapacity);
                    	optimalCombination.put("tempDistanceCalculation",""+tempDistanceCalculation);
                    	
                	}else if(Integer.parseInt(optimalCombination.get("tempDistanceCalculation")) > tempDistanceCalculation)
                	{                		
                		finalScore = tempDistanceCalculation + tempUnusedCapacity;
                    	optimalCombination.put("combinataion",combinataion);
                    	optimalCombination.put("finalScore",""+finalScore);
                    	optimalCombination.put("tempUnusedCapacity",""+tempUnusedCapacity);
                    	optimalCombination.put("tempDistanceCalculation",""+tempDistanceCalculation);
                	}
                }                
            }
            combinataion = "";
            //System.out.println();
            
            done = getNext(res, n, r);
        }
        //System.out.println(optimalCombination);
        return optimalCombination;
    }

    public static final boolean getNext(final int[] num, final int n, final int r)
    {
        int target = r - 1;
        num[target]++;

        if (num[target] > ((n - (r - target)) + 1))
        {
            // Carry the One
            while (num[target] > ((n - (r - target))))
            {
                target--;

                if (target < 0)
                {
                    break;
                }
            }

            if (target < 0)
            {
                return true;
            }

            num[target]++;

            for (int i = target + 1; i < num.length; i++)
            {
                num[i] = num[i - 1] + 1;
            }
        }

        return false;
    }
}
