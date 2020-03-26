module.exports = function(RED)
{
	"use strict";

	function HueButton(config)
	{
		RED.nodes.createNode(this, config);

		var scope = this;
		let bridge = RED.nodes.getNode(config.bridge);
		let { HueSwitchMessage } = require('../utils/messages');

		//
		// MEMORY
		this.lastUpdated = false;

		//
		// CHECK CONFIG
		if(!config.sensorid || bridge == null)
		{
			this.status({fill: "red", shape: "ring", text: "hue-button.node.not-configured"});
			return false;
		}

		//
		// UPDATE STATE
		scope.status({fill: "grey", shape: "dot", text: "hue-button.node.waiting"});

		//
		// ON UPDATE
		bridge.events.on('sensor' + config.sensorid, function(sensor)
		{
			var lastUpdated = scope.lastUpdated || false;
			if(sensor.state.lastUpdated != lastUpdated)
			{
				scope.lastUpdated = sensor.state.lastUpdated;

				// RETURN ON FIRST DEPLOY
				if (lastUpdated === false) {
					return;
				}

				// DEFINE HUMAN READABLE BUTTON NAME
				var buttonNameLocalized = "";
				if(sensor.state.buttonEvent == 1000)
				{
					buttonNameLocalized = RED._("hue-button.node.initial_press");
				}
				else if(sensor.state.buttonEvent== 1001)
				{
					buttonNameLocalized = RED._("hue-button.node.repeat");
				}
				else if(sensor.state.buttonEvent == 1002)
				{
					buttonNameLocalized = RED._("hue-button.node.short_release");
				}
				else if(sensor.state.buttonEvent == 1003)
				{
					buttonNameLocalized = RED._("hue-button.node.long_release");
				}
//				else
//				{
//					buttonNameLocalized = RED._("hue-button.node.button-off");
//				}

				// DEFINE HUMAN READABLE BUTTON ACTION
				var buttonActionLocalized = "";
				var buttonActionRaw = parseInt(sensor.state.buttonEvent.toString().substring(3));
				if(buttonActionRaw == 0)
				{
					buttonActionLocalized = RED._("hue-switch.node.action-pressed");
				}
				else if(buttonActionRaw == 1)
				{
					buttonActionLocalized = RED._("hue-switch.node.action-holded");
				}
				else if(buttonActionRaw == 2)
				{
					buttonActionLocalized = RED._("hue-switch.node.action-shortreleased");
				}
				else
				{
					buttonActionLocalized = RED._("hue-switch.node.action-longreleased");
				}

				// SEND STATUS
				scope.status({fill: "green", shape: "dot", text: buttonNameLocalized + " " + buttonActionLocalized});

				// SEND MESSAGE
				if(!config.skipevents)
				{
					var hueSwitch = new HueSwitchMessage(sensor);
					scope.send(hueSwitch.msg);
				}
			}
			else
			{
				scope.status({fill: "grey", shape: "dot", text: "hue-button.node.waiting"});
			}
		});

		//
		// CLOSE NODE / REMOVE EVENT LISTENER
		this.on('close', function()
		{
			bridge.events.removeAllListeners('sensor' + config.sensorid);
		});
	}

	RED.nodes.registerType("hue-button", HueSwitch);
}
