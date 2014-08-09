/* globals define */
define(function(require, exports, module) {
    'use strict';
    // import dependencies
    var Engine = require('famous/core/Engine');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');
    var Surface = require('famous/core/Surface');

    var Transitionable = require('famous/transitions/Transitionable');
    var SnapTransition = require('famous/transitions/SnapTransition');
    Transitionable.registerMethod('snap', SnapTransition);

    var GenericSync = require('famous/inputs/GenericSync');
    var MouseSync = require('famous/inputs/MouseSync');
    var TouchSync = require('famous/inputs/TouchSync');
    var ScrollSync = require('famous/inputs/ScrollSync');

    GenericSync.register({
        'mouse': MouseSync,
        'touch': TouchSync,
        'scroll': ScrollSync
    });

    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);

    function rgbDifference(r, g, b) {
        return 'rgb(' + Math.abs(255 - r) + ', ' + Math.abs(255 - g) + ', ' + Math.abs(255 - b) + ')';
    }

    var SURFACE_SIZE = [undefined, 100];
    var OPACITY_SCALE = 0.9;
    var OPACITY_THRESHOLD = 0.1;
    var BACKGROUND_COLOR = 'rgb(' + r + ', ' + g + ', ' + b + ')';

    // create the main context
    var mainContext = Engine.createContext();

    var position = new Transitionable(0);
    var opacity = new Transitionable(1);

    var sync = new GenericSync(
        ['mouse', 'touch', 'scroll'],
        { direction: GenericSync.DIRECTION_Y }
    );

    // your app here
    var background = new Surface({
        properties: {
            backgroundColor: BACKGROUND_COLOR
        }
    });

    var draggableSurface = new Surface({
        size: SURFACE_SIZE,
        properties: {
            backgroundColor: '#fff',
            cursor: 'pointer'
        }
    });

    var textOutlineSurface = new Surface({
        content: '10',
        size: SURFACE_SIZE,
        properties: {
            backgroundColor: 'transparent',
            color: '#fff',
            fontSize: '60px',
            fontWeight: '100',
            textAlign: 'right',
            paddingRight: '10%',
            pointerEvents: 'none',
            lineHeight: SURFACE_SIZE[1] + 'px',
            textShadow: '0px 0px 4px rgba(0,0,0,0.25)'
            // textShadow: '-1px -1px 0 rgba(0,0,0,0.5),1px -1px 0 rgba(0,0,0,0.5),-1px 1px 0 rgba(0,0,0,0.5),1px 1px 0 rgba(0,0,0,0.5)'
        }
    });

    var textSurface = new Surface({
        content: 'JOHNSON',
        size: SURFACE_SIZE,
        properties: {
            backgroundColor: 'transparent',
            color: rgbDifference(r, g, b),
            fontSize: '60px',
            fontWeight: 'bold',
            textAlign: 'center',
            pointerEvents: 'none',
            lineHeight: SURFACE_SIZE[1] + 'px'
        }
    });

    draggableSurface.pipe(sync);

    sync.on('update', function(data) {
        var currentPosition = position.get();
        var contextSize = mainContext.getSize();
        var percentagePosition = Math.round((currentPosition / contextSize[1]) * 100) / 100;
        var newOpacity = (OPACITY_SCALE - percentagePosition);
        var score = (newOpacity > 1) ? 10 : ((newOpacity < OPACITY_THRESHOLD) ? 1 : Math.floor((OPACITY_SCALE - percentagePosition) * 10) + 1);

        if (newOpacity < OPACITY_THRESHOLD)
            newOpacity = OPACITY_THRESHOLD;

        position.set(currentPosition + data.delta);
        opacity.set(newOpacity);

        textOutlineSurface.setContent(score);
    });

    sync.on('end', function(data) {
        var currentPosition = position.get();
        var velocity = data.velocity;
        var contextSize = mainContext.getSize();

        if (currentPosition < 0) {
            position.set(0, {
                method: 'snap',
                period: 150,
                velocity: velocity
            });
        }

        if ((currentPosition + SURFACE_SIZE[1]) > contextSize[1]) {
            position.set(contextSize[1] - SURFACE_SIZE[1], {
                method: 'snap',
                period: 150,
                velocity: velocity
            });
        }
    });

    var yPositionModifier = new Modifier({
        transform: function() {
            return Transform.translate(0, position.get(), 0);
        }
    });

    var opacityTextModifier = new Modifier({
        opacity: function() {
            return opacity.get();
        }
    });

    var opacityModifier = new Modifier({
        opacity: 0.1
    });

    var centerTextModifier = new Modifier({
        size: SURFACE_SIZE,
        origin: [0.5, 0],
        align: [0.5, 0]
    });

    mainContext.add(background);

    var moveableNode = mainContext.add(yPositionModifier);
    moveableNode.add(opacityModifier).add(draggableSurface);
    moveableNode.add(textOutlineSurface);
    moveableNode.add(centerTextModifier).add(opacityTextModifier).add(textSurface);
});
