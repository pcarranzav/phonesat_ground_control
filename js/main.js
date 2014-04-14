
var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;

exec("stty -F /dev/ttyUSB0 9600 ignbrk -brkint -imaxbel -opost -onlcr -isig -icanon -iexten -echo -echoe -echok -echoctl -echoke noflsh -ixon -crtscts");

var current_frame = 0;

var phonesat = {
	targetOrientation : 0,
	
	updateOrientationTarget : function(v) {
		console.log("change!");
		targetOrientation = v;
	},
	inputBuffer : new Buffer(100000),
	commPort : null
	
};

var state = 0;
var read_pos = 0;
var write_pos = 0;

fs.open('/dev/ttyUSB0','r',null,function(er,fd){
	var doRead = function(){
	fs.read(fd,phonesat.inputBuffer,0,2000,null,
		function(err,bytesRead){
			if(bytesRead > 10){
				
				$('#comms-container').html(phonesat.inputBuffer.toString());
				//console.log('w');
				/*
				write_pos += 1;
				if((write_pos + 100) >= 100000){
					write_pos = 0;
				}
				*/
			}
			setTimeout(doRead,400);
		});
	};
	setTimeout(doRead,400);
});

var msg = [];
var msg_size = 0;
var msg_start = 0;
var parseMsg = function(){
	while(read_pos < write_pos){
		//console.log('r');
		if(state == 0){
			//console.log(phonesat.inputBuffer[read_pos]);
			if(phonesat.inputBuffer[read_pos] == 'a'.charCodeAt(0)){
				state = 10;
				console.log("new message start");
				console.log(phonesat.inputBuffer[read_pos]);
			}
		}
		else if(state == 10){
			//console.log(phonesat.inputBuffer[read_pos]);
			if(phonesat.inputBuffer[read_pos] == 'z'.charCodeAt(0)){
				state = 11;
				console.log("new message10");
				
			}
			else
				state = 0;
			console.log(phonesat.inputBuffer[read_pos]);
		}
		else if(state == 11){
			//console.log(phonesat.inputBuffer[read_pos]);
			if(phonesat.inputBuffer[read_pos] == '2'.charCodeAt(0)){
				state = 1;
				console.log("new message11");
			}
			else
				state = 0;
			console.log(phonesat.inputBuffer[read_pos]);
		}
		else if(state==1){
			msg_size = phonesat.inputBuffer[read_pos]*256;
			state = 2;
		}
		else if(state==2){
			msg_size += phonesat.inputBuffer[read_pos];
			//msg_start = read_pos+1;
			console.log("starts at " + msg_start);
			console.log("size " + msg_size);
			state = 12;
		}
		else if(state==12){
			msg_size2 = phonesat.inputBuffer[read_pos]*256;
			state = 13;
		}
		else if(state==13){
			msg_size2 += phonesat.inputBuffer[read_pos];
			msg_start = read_pos+1;
			
			console.log("starts at " + msg_start);
			console.log("size " + msg_size2);
			
			if(msg_size == msg_size2)
				state = 3;
			else state = 0;
		}
		else if(state==3){
			if(msg.length < msg_size){
				msg.push(phonesat.inputBuffer[read_pos]);
			}
			else
			{
				state = 0;
				
				if(phonesat.inputBuffer[read_pos] == 23){
					state = 10;
					console.log("new message start");
				}
				
				
				buf = new Buffer(msg);
				//console.log('msg');
				//console.log(msg);
				//console.log('buf');
				//console.log(buf);
				
				
				
				fs.writeFileSync("img/feed/frame-" + (current_frame + 1) + ".jpg",buf,'binary');
				
				
				current_frame += 1;
				console.log("message complete");
				msg = [];
			}
		}
		
		read_pos += 1;
		if(read_pos >= 100000)
			read_pos = 0;
	}
	setTimeout(parseMsg,1);
}

//setTimeout(parseMsg,1);

$(function(){
	
	setTimeout(function(){
		$('#image-feed').attr("src","../img/feed/frame-" + current_frame + ".jpg");
	},200);
	
	$(".cs_knob").knob({
		min : 0, 
		max : 360, 
		step : 5, 
		angleOffset : 0, 
		angleArc : 360, 
		stopper : true, 
		readOnly : false, 
		cursor : false,  
		lineCap : 'butt', 
		thickness : '0.2', 
		width : 150, 
		displayInput : true, 
		displayPrevious : true, 
		fgColor : '#87CEEB', 
		inputColor : '#87CEEB', 
		font : 'Arial', 
		fontWeight : 'normal', 
		bgColor : '#EEEEEE', 
		draw : function () {
			if(this.$.data('skin') == 'tron') {
				var a = this.angle(this.cv)  // Angle
				, sa = this.startAngle          // Previous start angle
				, sat = this.startAngle         // Start angle
				, ea                            // Previous end angle
				, eat = sat + a                 // End angle
				, r = 1;
				this.g.lineWidth = this.lineWidth;
				this.o.cursor
				&& (sat = eat - 0.3)
				&& (eat = eat + 0.3);
				if (this.o.displayPrevious) {
					ea = this.startAngle + this.angle(this.v);
					this.o.cursor
					&& (sa = ea - 0.3)
					&& (ea = ea + 0.3);
					this.g.beginPath();
					this.g.strokeStyle = this.pColor;
					this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sa, ea, false);
					this.g.stroke();
				}
				this.g.beginPath();
				this.g.strokeStyle = r ? this.o.fgColor : this.fgColor ;
				this.g.arc(this.xy, this.xy, this.radius - this.lineWidth, sat, eat, false);
				this.g.stroke();
				this.g.lineWidth = 2;
				this.g.beginPath();
				this.g.strokeStyle = this.o.fgColor;
				this.g.arc( this.xy, this.xy, this.radius - this.lineWidth + 1 + this.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
				this.g.stroke();
				return false;
			}
		},
		release : phonesat.updateOrientationTarget
	});
	
	

});
