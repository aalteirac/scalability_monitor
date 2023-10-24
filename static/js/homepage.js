
var autoRefresh;
var lastQueued=0;
var lastQuery=0;
var maxClusters=1;
var connectedwh = false;

function smartScaleUP(query){
  if(query>25 && query-lastQuery>15){
    var selectElement = document.getElementById("whs");
    lastQuery=query;
    if (selectElement.selectedIndex +1< selectElement.options.length) {
      selectElement.selectedIndex += 1
      whCommand($('#whname').val(),`SET MIN_CLUSTER_COUNT=${$('#minc').val()} MAX_CLUSTER_COUNT=${$('#maxc').val()} WAREHOUSE_SIZE='${$('#whs').val()}'`)
    }
  }
}

function smartScaleOut(queued){
  var maxc=parseInt($('#maxc').val())
  if(queued>5 && (queued-lastQueued)>5 && (maxc+1<=10)){
    whCommand($('#whname').val(),`SET MIN_CLUSTER_COUNT=${$('#minc').val()} MAX_CLUSTER_COUNT=${maxc+1} WAREHOUSE_SIZE='${$('#whs').val()}'`)
    setTimeout(() => {
      updateWarehouse($('#whname').val(),true)
    }, 1000);
    lastQueued=queued
  }
}

function updateWarehouse(name,first=false) {
  var tempUrl = "/wh?wh_name="+name;
  $.ajax({
    url: tempUrl,
    type: "GET",
    success: function(data) {
      if(data.length==0){
        if (first==true) log("Warehouse " + name +" not found")
        connectedwh=false;
        $(".conn").hide()
      }
      else{
        if (first==true) log("Successfully connected to Warehouse " + name )
        connectedwh=true;
        $(".conn").show()
      }
      data=data[0]
      maxClusters=Math.max(maxClusters,data.started_clusters)
      $('#state').html('<i class="server icon"></i>'+data.state + `(max: ${maxClusters})`);
      $('#run').html(data.running+'<p class="kpi text"><i class="youtube icon"></i>Running</p>');
      $('#queued').html(data.queued+'<p class="kpi text"><i class="sync icon"></i>Queued</p>');
      $('#cluster').html(data.started_clusters+` (${data.min_cluster_count}-${data.max_cluster_count})<p class="kpi text"><i class="server icon"></i>Clusters (${data.size})</p>`);
      if(first==true){
        $('#minc').val(data.min_cluster_count)
        $('#maxc').val(data.max_cluster_count)
        $('#whs').val(data.size)
      }
      if($("#autoadj").prop("checked")==true){
        smartScaleOut(data.queued)
        smartScaleUP(data.running)
      }
    },
    error: function(error) {
      console.log(error);
    }
  });
}
function whCommand(whname,cmd){
  return new Promise((resolve,reject)=>{
    var tempUrl = "/whcmd?wh_name="+whname+"&command="+cmd;
    $.ajax({
      url: tempUrl,
      type: "GET",
      success: function(data) {
        resolve(data)
      },
      error: function(error) {
        reject(null)
      }
    });
  }) 
}

function getScripts(){
  return new Promise((resolve,reject)=>{
    var tempUrl = "/script";
    $.ajax({
      url: tempUrl,
      type: "GET",
      success: function(data) {
        resolve(data)
      },
      error: function(error) {
        reject(null)
      }
    });
  }) 
}
async function populateScripts(){
  var items=await getScripts();
  $.each(items, function (i, item) {
    $('#scsel').append($('<option>', { 
        value: item.value,
        text : item.text 
    }));
});
}

function getLine(word,text){
  const regexPattern = new RegExp(`${word}: ([^\n]+)`);
  const match = text.match(regexPattern);
  if (match) {
    return match[1];
  }
  return ""  
}

function detectPresult(text){
  var p95=getLine("p95",text)
  var p99=getLine("p99",text)
  var to=getLine("ETIMEDOUT",text)
  var sl=getLine("Scenarios launched",text)
  var sc=getLine("Scenarios completed",text)
  if (p95!="") $('#p95').html('<i class="server icon"></i>P95: '+p95+'ms');
  if (p99!="") $('#p99').html('<i class="server icon"></i>P99: '+p99+'ms');
  if (to!="") $('#to').html('<i class="server icon"></i>TimeOut: '+to );
  if (sl!="") $('#sl').html('<i class="server icon"></i>Launched: '+sl );
  if (sc!="") $('#sc').html('<i class="server icon"></i>Success: '+sc);
}

$(document).ready(function () {
  const ws = new WebSocket('ws://localhost:3001');

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = (event) => {
    if(event.data=="END"){
      finished=setInterval(() => {
        if ($('#run').text()=='0Running' && $('#queued').text()=='0Queued'){
          whCommand($('#whname').val(),`SUSPEND`)
          setTimeout(() => {
            updateWarehouse($('#whname').val())
          }, 700);
          clearInterval(autoRefresh);
          $('#whckb').prop('checked',false);
          clearInterval(finished);
          lastQueued=0;
          lastQuery=0;
        }
      }, 1000);
      return 
    }
    log(event.data);
    detectPresult(event.data);
    $('#screen').scroll
    jQuery("#screen").scrollTop(jQuery("#screen")[0].scrollHeight);
  };
 
  update_user_title("");
  populateScripts();
  log("****");

  $('#minc').change(function(ev){
    if($('#maxc').val()<$('#minc').val())
    $('#maxc').val($('#minc').val())
  })
  $('#commit').click(function(ev){
    whCommand($('#whname').val(),`SET MIN_CLUSTER_COUNT=${$('#minc').val()} MAX_CLUSTER_COUNT=${$('#maxc').val()} WAREHOUSE_SIZE='${$('#whs').val()}'`)
    setTimeout(() => {
      updateWarehouse($('#whname').val());
    }, 1000);
  })
  $('#whckb').click(function(ev){
    if(ev.currentTarget.checked==true){
      autoRefresh=setInterval(() => {
        updateWarehouse($('#whname').val());
      }, 1000);
    } else{
      clearInterval(autoRefresh)
    }
  });
  $('#clear').click(function(ev){
    $("#wrapper").empty();
    $('#p95').html('<i class="server icon"></i>P95: - ms');
    $('#p99').html('<i class="server icon"></i>P99: - ms');
    $('#to').html('<i class="server icon"></i>TimeOut: -' );
    $('#sl').html('<i class="server icon"></i>Launched: -' );
    $('#sc').html('<i class="server icon"></i>Success: -');
  })
  $('#gos').click(function(ev){
      maxClusters=1;
      $('#whckb').prop('checked',true);
      autoRefresh=setInterval(() => {
        updateWarehouse($('#whname').val());
      }, 1000);
      var tempUrl = "/art?sc="+$('#scsel').val();
      $.ajax({
        url: tempUrl,
        type: "GET",
        success: function(data) {
          
        },
        error: function(error) {
         
        }
      });
  });
  
  $('#setwh').click(function(ev){
    connectedwh=false;
    whname=$('#whname').val()
    updateWarehouse(whname,true)
  })
  $(".conn").hide()
});

