export interface DragCardConfig {
    entityUp?: string;
    entityDown?: string;
    entityLeft?: string;
    entityRight?: string;
    entityCenter?: string;
    entityHold?: string;
    entityDouble?: string;
    entityTriple?: string;
    entityQuadruple?: string;
    entityFivefold?: string;
    entitySixfold?: string;

    icoDefault?: string;
    icoUp?: string;
    icoRight?: string;
    icoDown?: string;
    icoLeft?: string;
    icoCenter?: string;
    icoHold?: string;
    icoDouble?: string;
    icoTriple?: string;
    icoQuadruple?: string;
    icoFivefold?: string;
    icoSixfold?: string;

    maxDrag?: number;
    stopSpeedFactor?: number;
    repeatTime?: number;
    holdTime?: number;
    maxMultiClicks?: number;
    multiClickTime?: number;
    deadzone?: number;

    isStandalone?: boolean;
    padding?: string;
    cardHeight?: string;

    height?: string;
    width?: string;
    backgroundColor?: string;
    borderRadius?: string;

    iconSize?: string;
}