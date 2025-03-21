import { Box2, Color } from "three/webgpu";
import { ContestantData } from "./ContestantData";


/**
 * ABlock class
 * contains infos about a block, that is one top and one bottom mesh
 */
export class ABlock {

    static LIGHT_COLORS: Color[] = [
        new Color(0x4299e1),  // AI/ML - Blue
        new Color(0x48bb78),  // Web3 - Green
        new Color(0xf6ad55),  // Gaming - Orange
        new Color(0xf687b3),  // Mobile - Pink
        new Color(0x9f7aea),  // Social - Purple
    ];

    static DARK_COLORS: Color[] = [
        new Color(0x2b6cb0),  // AI/ML - Dark Blue
        new Color(0x2f855a),  // Web3 - Dark Green
        new Color(0xdd6b20),  // Gaming - Dark Orange
        new Color(0xb83280),  // Mobile - Dark Pink
        new Color(0x6b46c1),  // Social - Dark Purple
    ];

    static ID:number = 0;
    static LIGHT_BASE_COLOR: Color = new Color( 0x999999 );
    static DARK_BASE_COLOR: Color = new Color( 0x000000 );
    
    id:number = ABlock.ID++;
    typeBottom:number = 0;
    typeTop:number = 0;
    box:Box2 = new Box2();
    height:number = 1;
    rotation:number = 0;
    topColorIndex:number = 0;
    contestant?: ContestantData;
    isHighlighted:boolean = false;

    topColor:Color = ABlock.LIGHT_COLORS[ this.topColorIndex ];
    baseColor:Color = ABlock.LIGHT_BASE_COLOR;

    setTopColorIndex( index:number ) {
        this.topColorIndex = index;
        this.topColor = ABlock.LIGHT_COLORS[ this.topColorIndex ];
    }
}