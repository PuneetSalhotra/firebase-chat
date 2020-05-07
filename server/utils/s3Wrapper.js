var aws = require('aws-sdk');
var Util = require('./util');
var forEachAsync = require('forEachAsync').forEachAsync;

var AwsSss = function () {
    //aws.config.loadFromPath('/var/node/Bharat/server/utils/configS3.json');
    aws.config.loadFromPath(`${__dirname}/configS3.json`);
    
    var s3 = new aws.S3();
    var util = new Util();
    
    this.createAssetBucket = function (request, callback) {

        // Create the parameters for calling createBucket
        var bucketParams = {
            Bucket: 'desker-' + request.bucket_asset_id + '-' + util.getcurrentTimeInMilliSecs()
            //Bucket : 'ds-8674'
        };

        //Setting Tags for S3 Buckets
        var params = {
            Bucket: 'desker-' + request.bucket_asset_id + '-' + util.getcurrentTimeInMilliSecs(),
            Tagging: {
                TagSet: [{
                        Key: "workforce_id",
                        Value: request.workforce_id
                    },
                    {
                        Key: "account_id",
                        Value: request.account_id
                    },
                    {
                        Key: "asset_id",
                        Value: request.bucket_asset_id
                    },
                    {
                        Key: "organization_id",
                        Value: request.organization_id
                    }
                ]
            }
        };

        /*s3.listBuckets(function(err, data) {
           if (err) {
              console.log("Error", err);
              callback(true, [], -2999);
           } else {
              console.log('Got all the buckets');
              searchBucket(data.Buckets, bucketParams).then((result)=>{
                 if(result === true) {
                      createBucket(bucketParams, params, callback)
                              .catch(()=>{
                                   //setTimeout(createBucket(bucketParams, params), 200);
                                   createBucket(bucketParams, params, callback);
                               })
                  } else {
                      getBucketTaggings(bucketParams).then((data)=>{
                          //console.log('data : ', data);
                           if(data === false) {
                              putBucketTags(params).then((resp)=>{ 
                                  if(resp === true){
                                      callback(false, bucketParams.Bucket, 200);
                                  } else {
                                      callback(true, [], -2998);
                                  }
                                }).catch(()=>{
                                    callback(true, [], -2998);
                                })
                          } else {
                              callback(false, bucketParams.Bucket, 200);
                          }
                      })
                  }
              })
              }
        });*/

        // createBucket(bucketParams, params, callback)
        //     .catch(() => {
        //         //setTimeout(createBucket(bucketParams, params), 200);
        //         createBucket(bucketParams, params, callback);
        //     })
        callback(true, 'Unable to assign Bucket Tags', -2998);

    };
    
    //Create the Bucket
    function createBucket(bucketParams, params, callback){
        return new Promise((resolve, reject)=>{
            //Creating an S3 Bucket
            s3.createBucket(bucketParams, function(err, data) {
               if (err) {
                  console.log("Error : ", err);
                  reject(err);
               } else {
                  console.log("Success Data", data);                  
                  putBucketTags(params).then((resp)=>{                     
                      if(resp === true){
                            callback(false, bucketParams.Bucket, 200);
                        } else {
                            callback(true, 'Unable to assign Bucket Tags', -2998);
                            }
                       }).catch(()=>{
                            callback(true, 'Unable to assign Bucket Tags', -2998);
                       }) 
               }
            });
        })
    }
        
        
    //Search for the Bucket    
    function searchBucket(data, bucketParams) {
            return new Promise((resolve, reject)=>{
                forEachAsync(data, function(next, i){
                   //if(i.Name.includes(bucketParams.Bucket)) {
                   if(i.Name.includes(bucketParams.Bucket)) {
                       return resolve(bucketParams.Bucket)
                   }
                   next();
                }).then(()=>{ return resolve(true); })
        })           
    }
        
    //get Bucket Taggings
    function getBucketTaggings(bucketParams){ //false Tags are not assigned
        return new Promise((resolve, reject)=>{
            var taggings = new Array('workforce_id', 'account_id', 'asset_id', 'organization_id');
             
            s3.getBucketTagging(bucketParams, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    reject(err);
                } else {
                    console.log(data);
                    if(data.TagSet.length > 0){
                        forEachAsync(data.TagSet, function(next, i){  
                            if(taggings.indexOf(i.Key) === -1){
                                return resolve(false)
                            }
                            next();
                        }).then(()=>{
                            resolve(true)
                        })
                    } else {
                        //puttags
                        resolve(false)
                    }                
                }            
            });
        })            
    }
    
    function putBucketTags(params) {
        return new Promise((resolve, reject)=>{
            s3.putBucketTagging(params, function(err, data) {
                if (err) {
                   console.log('error in putbuckettags ', err, err.stack);
                   reject(err);
                } 
                else {
                   console.log(data);
                   resolve(true)
                }
            });
        });
    }

    this.uploadObject = async (request) => {
        var params = {
            Bucket: request.bucket_name, 
            Key: request.key_name
           };

        s3.createMultipartUpload(params, function(err, data) {
             if (err) console.log(err, err.stack); // an error occurred
             else     console.log(data);           // successful response
             /*
             data = {
              Bucket: "examplebucket", 
              Key: "largeobject", 
              UploadId: "ibZBv_75gd9r8lH_gqXatLdxMVpAlj6ZQjEs.OwyF3953YdwbcQnMA2BLGn8Lx12fQNICtMw5KyteFeHw.Sjng--"
             }
             */
           });
    };
     
    
  };
  
  module.exports = AwsSss;