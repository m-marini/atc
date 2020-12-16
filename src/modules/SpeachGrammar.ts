export const GRAMMAR = `
#JSGF V1.0;
grammar command;

    <alpha> = alpha | bravo | charlie | delta | echo | foxtrot | golf | hotel | india | juliet | kilo | lima | mike | november | oscar | papa | quebec | romeo | sierra | tango | uniform | victor | whiskey | x-ray | yenkee | zulu ;

    <number> = zero | one | two | three | four | six | seven | eight | naina ;

    <alphanum> = <alpha> | <number> ;

    <id> = <alphanum>+ ;

    <rwyId> = <number>+ [left | right | center] ;

    <runway> = runway <rwyId> ;

    <fl> = flight level <number>+ ;

    <atc> = (paris | london | milan | munich | frankfurt) ATC ;

    <climb> = climb to <fl> ;

    <descend> = descend to <fl> ;

    <maintain> = maintain <fl> ;

    <fly> = fly to <id> [via <id>] ;

    <hold> = hold at ((current position) | <id>) ;
    
    <land> = land <runway> ;
    
    <take> = take off <runway> <climb> ;
    
    <land> = cleared to <land> <runway> ;

    <takeoff> = <runway> cleared to takeoff climb to <fl> ;
    
    public <command> = <flightId1> <atc> (<climb> | <descend> | <maintain> | <fly> | <hold> | <land> | <takeoff>) ;
`;
