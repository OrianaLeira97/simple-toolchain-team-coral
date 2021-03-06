var payload = {
    "zipcode":null,
    "houseage": null,
    "distance":null,
    "stores":null,
    "sqft":null,
}

const codes= [{"zip_code":27601,"house_value":252216.3249999999},
{"zip_code":27602,"house_value":259411.92},
{"zip_code":27603,"house_value":229916.9441860465},
{"zip_code":27604,"house_value":239927.2297297298},
{"zip_code":27605,"house_value":287501.5046511627},
{"zip_code":27606,"house_value":269187.943902439},
{"zip_code":27607,"house_value":253678.3},
{"zip_code":27608,"house_value":236132.6903225807},
{"zip_code":27609,"house_value":239875.305882353},
{"zip_code":27610,"house_value":247127.6225806452},
{"zip_code":27611,"house_value":273820.0371428571}]





function onChange()
{
    payload.houseage = parseFloat(document.getElementById('houseage').value);
    payload.distance = parseFloat(document.getElementById('distance').value)
    payload.stores = parseFloat(document.getElementById('stores').value);
    payload.sqft = parseFloat(document.getElementById('sqft').value);

    console.log(payload)

}


function onSelect()
{
    let e = document.getElementById("zipcode");
    payload.zipcode = e.options[e.selectedIndex].value;
    console.log(payload)

}



 
function onEstimate(){
   /*  const values = Object.payload.map(field => field); */
    const payload_scoring = {"input_data":
            [{"fields":[Object.keys(payload)],
            "values":[Object.values(payload)]}]  
    }
    console.log(payload_scoring)

    const result = JSON.stringify(sendPayloadToDeployment(payload_scoring))

    console.log(result)

    let average_zipcode = {}
    let average = codes.forEach(code => {
        average_zipcode[code.zip_code] = code.house_value
    })
    console.log(average_zipcode)
   
    document.getElementById("average-price").value = average_zipcode[payload.zipcode]
 

    

    //document.getElementById("price-output").value = Math.round(Math.random()*1000000,2);
    return result
}













function start_drawing(e)
{
    g_mouse_is_down = true;
    g_prev_pixel_X = e.clientX - document.getElementById( 'drawing_box' ).getBoundingClientRect().left;
    g_prev_pixel_Y = e.clientY - document.getElementById( 'drawing_box' ).getBoundingClientRect().top;
}


function stop_drawing(e)
{
    g_mouse_is_down = false;
    saveImage();
}


function draw_line(e)
{
    if( ( g_mouse_is_down ) && ( g_prev_pixel_X > -1 ) && ( g_prev_pixel_Y > -1 ) )
    {
        pixel_X = e.clientX - document.getElementById( 'drawing_box' ).getBoundingClientRect().left;
        pixel_Y = e.clientY - document.getElementById( 'drawing_box' ).getBoundingClientRect().top;
        
        var ctx = document.getElementById( 'drawing_box' ).getContext( '2d' );
        ctx.strokeStyle = "purple";
        ctx.lineWidth = g_line_width;
        ctx.beginPath();
        ctx.moveTo( g_prev_pixel_X, g_prev_pixel_Y );
        ctx.lineTo( pixel_X, pixel_Y );
        ctx.stroke();
        
        g_prev_pixel_X = pixel_X;
        g_prev_pixel_Y = pixel_Y;
        
        if( pixel_X < g_min_X ){ g_min_X = pixel_X; }
        if( pixel_X > g_max_X ){ g_max_X = pixel_X; }
        if( pixel_Y < g_min_Y ){ g_min_Y = pixel_Y; }
        if( pixel_Y > g_max_Y ){ g_max_Y = pixel_Y; }
    }
}


function clearCanvas()
{
    var canvas = document.getElementById( 'drawing_box' );
    var ctx = canvas.getContext( '2d' );
    ctx.clearRect( 0, 0, canvas.width, canvas.height );
}


function clearPayloadDiv()
{
    document.getElementById( 'payload_pre' ).innerHTML = "";
    document.getElementById( 'payload_spinner' ).style.display = "none";
}


function populateResultsDiv( result )
{
   
    result = JSON.parse(result)
    if (result && result.predictions && result.predictions.length) {
        console.log(result.predictions[0])
        result = `${result.predictions[0].values[0][0]}`
    } else {
        result = "Invalid results from deployed model."
    }

    document.getElementById("price-output").value = result;
    console.log(result)
}

function clearResultsDiv()
{
    document.getElementById( 'results_pre' ).innerHTML = "";
    document.getElementById( 'results_spinner' ).style.display = "none";
}


function resetGlobalVars()
{
    g_mouse_is_down = false;
    g_prev_pixel_X  = -1;
    g_prev_pixel_Y  = -1;
    g_min_X = 200;
    g_min_Y = 200;
    g_max_X = 0;
    g_max_Y = 0;
}


function resetUI()
{
    clearCanvas();
    clearPayloadDiv();
    clearResultsDiv();
    document.getElementById( 'submit_button' ).title = 'Submit current drawing for analysis';
}


function clear_everything()
{
    resetUI();

    resetGlobalVars();

    g_saved_digit = null;
}


function saveImage()
{
    var canvas = document.getElementById( 'drawing_box' );
    var ctx = canvas.getContext( '2d' );
    g_saved_digit = ctx.getImageData( 0, 0, canvas.width, canvas.height );
}


function revertImage()
{
    resetUI();
    
    var ctx = document.getElementById( 'drawing_box' ).getContext( '2d' );
    ctx.putImageData( g_saved_digit, 0, 0 );
}


function submit_drawing()
{
    if( null !== document.getElementById( 'submit_button' ).title.match( /clear/i ) )
    {
        alert( "Click 'Clear' to clean the canvas and start again." );
        return;
    }    

    document.getElementById( 'submit_button' ).title = "Click 'Clear' to clean the canvas and start again";

    document.getElementById( 'payload_spinner' ).style.display = 'block';
    
    digit_img = get_bounding_box();

    // Note: The timeouts here are just to gradually show the
    // progression of preprocessing steps in the UI
    setTimeout( function()
    {
        [ centered_img, box_X, box_Y ] = center( digit_img );

        var deployment_type = document.querySelector( 'input[name="deployment_type"]:checked' ).value;
        
        if( deployment_type.match( /function/ )  )
        {
            // If using the function deployment, we don't need to do any more
            // preprocessing here in the app because the function handles that
            
            var payload = { "values" : [ { "height" : centered_img.height, "data" : [ Array.from( centered_img.data ) ] } ] };

            populatePayloadDiv( payload );

            sendPayloadToDeployment( payload );
        }
        else
        {
            // To send a payload to the model deployment, we need to do
            // more preprocessing here in the app
            setTimeout( function()
            {
                let tinier_img = resize_8x8(centered_img, box_X, box_Y)

                setTimeout( function()
                {
                    var gray_img = greyscale( tinier_img );
                    
                    var arr = create_array_28x28( gray_img );
                    
                    var payload = {
                        input_data: [ 
                            {"values" : [ arr ] }
                        ]
                    };
                        
                    populatePayloadDiv( payload );

                    sendPayloadToDeployment( payload );

                }, 1000 );

            }, 1000 );
        }

    }, 1000 );
}


function drawRedBox( x, y, width, height )
{
    var ctx = document.getElementById( 'drawing_box' ).getContext( '2d' );
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect( x, y, width, height );
    ctx.stroke();    
}

function get_bounding_box()
{
    min_X  = g_min_X - g_line_width/2;
    min_Y  = g_min_Y - g_line_width/2;
    width  = g_max_X - g_min_X + g_line_width;
    height = g_max_Y - g_min_Y + g_line_width;
    
    var ctx = document.getElementById( 'drawing_box' ).getContext( '2d' );
    var digit_img = ctx.getImageData( min_X, min_Y, width, height );

    // Use a red box to show what's going on
    drawRedBox( min_X, min_Y, width, height );
    
    return digit_img;
}


function center( digit_img )
{
    var canvas = document.getElementById( 'drawing_box' );
    var ctx = canvas.getContext( '2d' );
    
    // Center the digit on the canvas
    var digit_min_X = canvas.width/2  - digit_img.width/2;
    var digit_min_Y = canvas.height/2 - digit_img.height/2;
    clearCanvas();
    ctx.beginPath();
    ctx.putImageData( digit_img, digit_min_X, digit_min_Y );

    // Get a square bounding box
    var max_dimension = ( digit_img.height > digit_img.width ) ? digit_img.height : digit_img.width;
    var square_box_min_X = canvas.width/2  - max_dimension/2;
    var square_box_min_Y = canvas.height/2 - max_dimension/2;
    centered_img = ctx.getImageData( square_box_min_X, square_box_min_Y, max_dimension, max_dimension );

    // Use a red box to show what's going on
    drawRedBox( square_box_min_X - 2, square_box_min_Y - 2, max_dimension + 4, max_dimension + 4 );
    
    return [ centered_img, square_box_min_X, square_box_min_Y ];
}


function resize_28x28( img, X, Y )
{
    var canvas = document.getElementById( 'drawing_box' );
    var ctx    = canvas.getContext( '2d' );

    // Save a copy of the original image in a temporary canvas
    var tempCanvas1    = document.createElement("canvas");
    tempCanvas1.width  = canvas.width;
    tempCanvas1.height = canvas.height;
    var tctx1          = tempCanvas1.getContext("2d");
    tctx1.putImageData( img, 0, 0 );

    // Use a second temporary canvas to scale the image way down to 28x28
    var tempCanvas2    = document.createElement("canvas");
    tempCanvas2.width  = canvas.width;
    tempCanvas2.height = canvas.height;
    var tctx2          = tempCanvas2.getContext("2d");
    scale = 28/img.width;
    tctx2.scale( scale, scale );
    tctx2.drawImage( tempCanvas1, 0, 0 );
    tiny_img = tctx2.getImageData( 0, 0, 28, 28 );

    // Show what's going on
    clearCanvas();
    ctx.beginPath();
    ctx.drawImage( tempCanvas2, 6, 6 );
    drawRedBox( 4, 4, 32, 32 );

    return tiny_img;
}

function resize_8x8( img, X, Y )
{
    var canvas = document.getElementById( 'drawing_box' );
    var ctx    = canvas.getContext( '2d' );

    // Save a copy of the original image in a temporary canvas
    var tempCanvas1    = document.createElement("canvas");
    tempCanvas1.width  = canvas.width;
    tempCanvas1.height = canvas.height;
    var tctx1          = tempCanvas1.getContext("2d");
    tctx1.putImageData( img, 0, 0 );

    // Use a second temporary canvas to scale the image way down to 28x28
    var tempCanvas2    = document.createElement("canvas");
    tempCanvas2.width  = canvas.width;
    tempCanvas2.height = canvas.height;
    var tctx2          = tempCanvas2.getContext("2d");
    scale = 8/img.width;
    tctx2.scale( scale, scale );
    tctx2.drawImage( tempCanvas1, 0, 0 );
    tiny_img = tctx2.getImageData( 0, 0, 8, 8 );

    // Show what's going on
    // clearCanvas();
    // ctx.beginPath();
    // ctx.drawImage( tempCanvas2, 6, 6 );
    // drawRedBox( 4, 4, 32, 32 );

    return tiny_img;
}


function greyscale( img )
{
    var canvas   = document.getElementById( 'drawing_box' );
    var ctx      = canvas.getContext( '2d' );
    var grey_img = ctx.createImageData( img.width, img.height );

    // Set Red, Green, and Blue values to 0, keep the Alpha value
    for( var i = 0; i < img.data.length; i += 4 )
    {
        grey_img.data[i]   = 0;
        grey_img.data[i+1] = 0;
        grey_img.data[i+2] = 0;
        grey_img.data[i+3] = img.data[i+3];
    }
    
    // Show what's going on
    clearCanvas();
    ctx.beginPath();
    ctx.putImageData( grey_img, 6, 6 );
    drawRedBox( 4, 4, 32, 32 );
    
    return grey_img;
}


function create_array_28x28( img )
{
    var arr = [];
    for( var i = 0; i < img.data.length; i += 4 )
    {
        arr.push( img.data[i+3] / 16 );
    }
    
    return arr;
}


function processresultHandler( result )
{
    if( "values" in result )
    {
        // This is what's returned by the sample model deployment
        var model_result = document.getElementById( 'results_pre' ).innerHTML = result["values"][0];
        populateResultsDiv( model_result );
    }
    else if( "digit_class" in result )
    {
        // This is what's returned by the sample function deployment
        var func_result = document.getElementById( 'results_pre' ).innerHTML = result["digit_class"];
        populateResultsDiv( func_result );
    }
    else
    {
        var err_str = JSON.stringify( result, null, 3 );
        populateResultsDiv( err_str );
       // alert( err_str );
    }

}

