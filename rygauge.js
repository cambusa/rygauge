/****************************************************************************
* Name:            rygauge.js                                               *
* Project:         Cambusa/ryQue                                            *
* Version:         1.69                                                     *
* Description:     Subset Sum Problem Remedy                                *
* Copyright (C):   2015  Rodolfo Calzetti                                   *
*                  License GNU LESSER GENERAL PUBLIC LICENSE Version 3      *
* Contact:         https://github.com/cambusa                               *
*                  postmaster@rudyz.net                                     *
****************************************************************************/

var MAX_LEVEL=10;
var SOGLIA_ITERAZIONI=500;
var DIAMETRO=2001;  // 2*1000 +1

// COSTANTI DI FASE
var gaugeExhaustive=0;
var gaugeStochastic=1;
var gaugeEnd=2;

function StructStatus(){
    // CREO UN VETTORE FILLATO DI ZERI
    var v=Array.apply(null, {length: MAX_LEVEL+1}).map(function() {return 0;})
    
    return {
        Phase:gaugeExhaustive,
        SubPhase:false,
        Tolerance:0,
        Gauge:0,
        ExhaustiveLevel:0,
        SkipIndex:false,
        Solutions:0,
        SkipSolutions:10,
        MinSize:1,
        MaxSize:0,
        Timeout:5,
        MaxValore:0,
        LastLevel:0,
        LastIndici:v
    }
}

function rygauge(options, missing){
    this.haystack=[];
    this.likeavirgin=true;
    var propabort=false;
    var propobj=this;
    var actualsettings={
        tolerance:0.001,
        gauge:0,
        exhaustive:0,
        skipsolutions:10,
        minsize:1,
        maxsize:0,
        timeout:5,
        lastlevel:0,
        progress:false,
        issue:false
    };
    setsettings(options);
    var $Status=new StructStatus();
    var $Valori=[];
    var $StatusErrNumber=0;
    var $StatusErrDescription="";
    var $StatusRitorno=[];
    var $StatusStorico=[];
    var $StatusSkipUsed=[];
    var $MsgAvanzamento="";
    var $LastControlloF=0;
    var $LastControlloT=0;
    var $SommaProb=0;
    var $Iterazioni=0;
    var $SubIterazioni=0;
    var $FaseRicerca=0;
    var $RicercaBipolare=0;
    var $IterazioniAlla4=0;
    var $FaseIterazioni=0;
    var $UltimoTolto=0;
    var $UltimoAggiunto=0;
    var $ContaSelez=0;
    var $TotaleSelez=0;
    this.search=function(){
        try{
            if(propobj.haystack.length==0){
                if(window.console){console.log("Empty haystack!")}
                if(actualsettings.issue)
                    actualsettings.issue(false);
                return;
            }
            propabort=false;

            $StatusRitorno=[];
            $StatusErrNumber=0;
            $StatusErrDescription="";

            $LastControlloF=(new Date()).getTime()/100;
            $LastControlloT=$LastControlloF;
            $RicercaBipolare=0;
            $FaseIterazioni=0;
            $Iterazioni=0;
            $SubIterazioni=0;
            $FaseRicerca=0;
            $IterazioniAlla4=0;
            $SommaProb=0;
            $ContaSelez=0;
            $TotaleSelez=0;
            $UltimoTolto=0;
            $UltimoAggiunto=0;
            
            $MsgAvanzamento="";
            if(window.console){console.log("Searching...")}
        
            var $NewLevel=0;
            
            $TotaleSelez=0;
            $ContaSelez=0;
            if(propobj.likeavirgin){
                if(actualsettings["tolerance"]!=missing)
                    $Status.Tolerance=parseFloat(actualsettings["tolerance"]);
                if(actualsettings["gauge"]!=missing)
                    $Status.Gauge=parseFloat(actualsettings["gauge"]);
                if(actualsettings["exhaustive"]!=missing)
                    $Status.ExhaustiveLevel = parseInt(actualsettings["exhaustive"]);
                if(actualsettings["skipsolutions"]!=missing)
                    $Status.SkipSolutions = parseInt(actualsettings["skipsolutions"]);
                if(actualsettings["minsize"]!=missing)
                    $Status.MinSize = parseInt(actualsettings["minsize"]);
                if(actualsettings["maxsize"]!=missing)
                    $Status.MaxSize = parseInt(actualsettings["maxsize"]);
                if(actualsettings["timeout"]!=missing)
                    $Status.Timeout = parseInt(actualsettings["timeout"]);
                if(actualsettings["newlevel"]!=missing)
                    $NewLevel = parseInt(actualsettings["newlevel"]);
                
                // FACCIO UNA COPIA PER LASCIARE INVARIATO IL VETTORE ORIGINALE
                var copia=[];
                if(typeof propobj.haystack[propobj.haystack.length-1]=="object"){
                    // CARICATI OGGETTI CON VALORE E RIFERIMENTO
                    for(var i in propobj.haystack){
                        if(propobj.haystack[i])
                            copia.push(propobj.haystack[i]);
                    }
                }
                else{
                    // CARICATI ELEMENTI CON IL SOLO VALORE
                    for(var i in propobj.haystack){
                        copia.push({value:propobj.haystack[i], ref:i});
                    }
                }
                
                copia.sort(function(a,b){
                    return a.value-b.value;
                });

                $Status.MaxValore=copia.length;
                $Valori=[];
                
                var k=1;
                for(var $i in copia){
                    $Valori[k++]={
                        Valore:copia[$i].value,
                        IndiceOrig:copia[$i].ref,
                        Selezionato:0,
                        ProbAggiungere:0,
                        ProbTogliere:0
                    };
                }
                
                if($Status.Tolerance<0.000001){
                    $Status.Tolerance=0.001;
                }
                
                $Status.SkipIndex=false;
                $Status.Solutions=0;
                $Status.LastLevel=1;
                if($Status.SkipSolutions==0){
                    $Status.SkipSolutions=10;
                }
                if($Status.ExhaustiveLevel<0){
                    $Status.ExhaustiveLevel=0;
                }
                else if($Status.ExhaustiveLevel==0){
                    $Status.ExhaustiveLevel=3;
                    $Status.SkipIndex=true;
                }
                else if($Status.ExhaustiveLevel>MAX_LEVEL){
                    $Status.ExhaustiveLevel=MAX_LEVEL;
                }
                if($Status.ExhaustiveLevel>0)
                    $Status.Phase=gaugeExhaustive;
                else
                    $Status.Phase=gaugeStochastic;
                if($Status.MinSize<=0){
                    $Status.MinSize=1;
                }
                if($Status.MaxSize<=0){
                    $Status.MaxSize=$Status.MaxValore;
                }
                if($Status.MinSize>$Status.MaxSize){
                    $Status.MinSize=$Status.MaxSize;
                }
                if($Status.LastLevel<$Status.MinSize){
                    $Status.LastLevel=$Status.MinSize;
                }
                if($Status.ExhaustiveLevel>$Status.MaxSize){
                    $Status.ExhaustiveLevel=$Status.MaxSize;
                }
                if($NewLevel>0){
                    $Status.LastLevel=$NewLevel;
                }
                if($Status.MaxValore==0){
                    $StatusErrNumber=5;
                    $StatusErrDescription="No values";
                    throw new Exception( $StatusErrDescription );
                }
                $StatusSkipUsed=[];
                propobj.likeavirgin=false;
            }
            setTimeout(function(){
                subsearch();
            });
        }
        catch($e){
            $StatusErrNumber=5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
        }
    }
    this.settings=function(opts){
        setsettings(opts);
    }
    this.abort=function(){
        propabort=true;
    }
    function subsearch(){
        /********************
        * Ricerca soluzioni *
        ********************/
        try{
            var $Esito=0;
            var $Controllo=0;
            var $exitdo=false;
            $Status.SubPhase=false;
            do{
                switch($Status.Phase){
                case gaugeExhaustive:
                    /************************
                    * FASE: RICERCA ENNUPLE *
                    ************************/
                    for($i=$Status.LastLevel; $i<=$Status.ExhaustiveLevel; $i++){
                        $Status.LastLevel = $i;
                        
                        $MsgAvanzamento="Looking for small subsets (" + $i + " of " + $Status.ExhaustiveLevel + ")";
                        if(window.console){console.log($MsgAvanzamento)}
                        
                        $Esito=RicercaEnnuple(1, $i, $Status.Gauge);
                        
                        if($Status.Phase == gaugeEnd){
                            // VOGLIO OTTENERE UNA EXIT DO
                            $exitdo=true;
                            break;
                        }
                        $Controllo = true;
                        if($Esito){
                            /********************
                            * Trovata soluzione *
                            ********************/
                            // ABBASSO TUTTI I FLAG SELEZIONATO
                            ResettaSelezione();
                            // ALZO I FLAG SELEZIONATO CORRIPONDENTI ALLA SOLUZIONE TROVATA
                            for($j=1; $j<=$Status.LastLevel; $j++){
                                $Valori[$Status.LastIndici[$j]].Selezionato = true;
                            }
                            // SERIALIZZO LA SOLUZIONE
                            var sol=SerializzaSoluzione();
                            // CONTROLLO CHE NON SIA GIÀ STATA TROVATA IN FASI PRECEDENTI
                            if(ControllaStorico(sol)){
                                // GESTIONE SKIP ATTIVO QUANDO LA RICERCA ESAUSTIVA NON È SPECIFICATA (=0)
                                if($Status.SkipIndex){
                                    if($Status.LastLevel==3){
                                        if($Status.Solutions>=$Status.SkipSolutions-1){
                                            $Status.Phase = gaugeStochastic;
                                            $MsgAvanzamento="Stochastic search...";
                                            if(window.console){console.log($MsgAvanzamento)}
                                        }
                                    }
                                }
                                // STORICIZZO LA SOLUZIONE
                                SalvaStorico(sol);
                                // VOGLIO OTTENERE UNA EXIT FOR
                                break;
                            }
                            else{
                                $Controllo = false;
                            }
                        }
                        if(!$Esito){
                            for($j=1; $j<=MAX_LEVEL; $j++){
                                $Status.LastIndici[$j] = 0;
                            }
                        }
                        if(!$Controllo){
                            $i-=1;
                        }
                    }
                    if($exitdo){
                        break;
                    }
                    if($Esito){
                        // VOGLIO OTTENERE UNA EXIT FOR
                        $exitdo=true;
                        break;
                    }
                    else{
                        $Status.Phase=gaugeStochastic;
                        $MsgAvanzamento="Stochastic search...";
                        if(window.console){console.log($MsgAvanzamento)}
                    }
                    break;  // EXIT CASE
                case gaugeStochastic:
                    /***************************
                    * FASE: RICERCA STATISTICA *
                    ***************************/
                    $MsgAvanzamento="Stochastic search (" + $Iterazioni + " iterations)";
                    if(RicercaStatistica()){
                        /********************
                        * Trovata soluzione *
                        ********************/
                        if(($Status.MinSize<=$ContaSelez)&&($ContaSelez<=$Status.MaxSize)){
                            // SERIALIZZO LA SOLUZIONE
                            var sol=SerializzaSoluzione();
                            // CONTROLLO CHE NON SIA GIÀ STATA TROVATA IN FASI PRECEDENTI
                            if(ControllaStorico(sol)){
                                // STORICIZZO LA SOLUZIONE
                                SalvaStorico(sol);
                                /******************************
                                * Voglio ottenere una exit do *
                                ******************************/
                                $exitdo=true;
                                break;
                            }
                        }
                        /******************************************************
                        * La soluzione non era accettabile:                   *
                        * aggiorno le totalizzazioni dei selezionati correnti *
                        ******************************************************/
                        $TotaleSelez = 0;
                        $ContaSelez = 0;
                        for($i=1; $i<=$Status.MaxValore; $i++){
                             if($Valori[$i].Selezionato){
                                 $TotaleSelez = $TotaleSelez + $Valori[$i].Valore;
                                 $ContaSelez++;
                             }
                        }
                    }
                    break;  // EXIT CASE
                }
                if($exitdo){
                    break;
                }
                ControllaBreak();
            }while($Status.Phase!=gaugeEnd&&!$Status.SubPhase);
        }
        catch($e){
            $StatusErrNumber=5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
        }
        if($Status.SubPhase){
            setTimeout(function(){
                subsearch();
            });
        }
        else{
            if($Status.Phase==gaugeEnd){
                propobj.likeavirgin=true;
            }
            // GESTIONE USCITA
            if($StatusRitorno.length>0){
                if(window.console){console.log("Eureka!")}
                if(actualsettings.issue)
                    actualsettings.issue($StatusRitorno);
            }
            else{
                if(window.console){console.log("Subset not found!")}
                if(actualsettings.issue)
                    actualsettings.issue(false);
            }
        }
    }
    function setsettings(opts){
        if(opts==missing){ opts={} }
        if(opts.haystack!=missing){ propobj.haystack=opts.haystack }
        if(opts.tolerance!=missing){ actualsettings.tolerance=opts.tolerance }
        if(opts.gauge!=missing){ actualsettings.gauge=opts.gauge }
        if(opts.exhaustive!=missing){ actualsettings.exhaustive=opts.exhaustive }
        if(opts.skipsolutions!=missing){ actualsettings.skipsolutions=opts.skipsolutions }
        if(opts.minsize!=missing){ actualsettings.minsize=opts.minsize }
        if(opts.maxsize!=missing){ actualsettings.maxsize=opts.maxsize }
        if(opts.timeout!=missing){ actualsettings.timeout=opts.timeout }
        if(opts.lastlevel!=missing){ actualsettings.lastlevel=opts.lastlevel }
        if(opts.progress!=missing){ actualsettings.progress=opts.progress }
        if(opts.issue!=missing){ actualsettings.issue=opts.issue }
        this.likeavirgin=true;
    }
    function TrovaPrimo($Rif){
        /**************************
        * Procedimento dicotomico *
        **************************/
        try{
            var $Ritorno=0;
            var $CurrCnt=0;
            var $Min=1;
            var $Max=$Status.MaxValore;
            // DETERMINO L'INDICE DI RITORNO
            while(true){
                if($Max-$Min<2){
                    if(Math.abs($Rif-$Valori[$Max].Valore)<=$Status.Tolerance)
                        $Ritorno=$Max;
                    else if(Math.abs($Rif-$Valori[$Min].Valore)<=$Status.Tolerance)
                        $Ritorno=$Min;
                    else
                        $Ritorno=0;
                    break;
                }
                else{
                    $CurrCnt=Math.floor($Min+($Max-$Min)/2);
                    if(Math.abs($Rif - $Valori[$CurrCnt].Valore) <= $Status.Tolerance){
                        $Ritorno = $CurrCnt;
                        while($CurrCnt > 1){
                            $CurrCnt -= 1;
                            if(Math.abs($Rif - $Valori[$CurrCnt].Valore) > $Status.Tolerance){
                                break;
                            }
                            $Ritorno = $CurrCnt;
                        }
                        break;
                    }
                    else if($Rif < $Valori[$CurrCnt].Valore){
                        $Max = $CurrCnt;
                    }
                    else{
                        $Min = $CurrCnt;
                    }
                }
            }
        }
        catch($e){
            $StatusErrNumber = 5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
            $Ritorno=0;
        }
        return $Ritorno;
    }
    function SerializzaSoluzione(){
        $StatusRitorno=[];
        $Storico=[];
        for($i=1; $i<=$Status.MaxValore; $i++){
            if($Valori[$i].Selezionato){
                $StatusRitorno.push($Valori[$i].IndiceOrig);
                $Storico.push($i);
            }
        }
        return $Storico.join();
    }
    function SalvaStorico(sol){
        $StatusStorico.push(sol);
    }
    function ResettaSelezione(){
        $TotaleSelez = 0;
        $ContaSelez = 0;
        for(var $s in $Valori)
            $Valori[$s].Selezionato=false;
         
    }
    function ControllaStorico(sol){
        return ($StatusStorico.indexOf(sol)<0);
    }
    function ControllaBreak(){
        try{
            $CurrTimer=(new Date()).getTime()/100;
            if($CurrTimer-$LastControlloF>5){
                if(actualsettings.progress){    // GESTIONE AVANZAMENTO
                    actualsettings.progress($MsgAvanzamento);
                }
                if(propabort){  // GESTIONE INTERRUZIONE
                    $Status.Phase=gaugeEnd;
                    if(window.console){console.log("Abort occurred!")}
                }
                else if($Status.Timeout>0){
                    if($Status.Phase!=gaugeEnd){ // GESTIONE TIMEOUT
                        if(($CurrTimer-$LastControlloT)>10*$Status.Timeout){
                            // TIMEOUT SCADUTO: SCRIVO UNA RISPOSTA VUOTA
                            $StatusRitorno=[];
                            $Status.Phase=gaugeEnd;
                            if(window.console){console.log("Timeout occurred!")}
                        }
                    }
                }
                $LastControlloF=$CurrTimer;
            }
            else if($CurrTimer-$LastControlloF>1){
                if($Status.Phase!=gaugeEnd){
                    $Status.SubPhase=true;
                }
            }
        }
        catch($e){
            $StatusErrNumber=5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
            $Status.Phase=gaugeEnd;
        }
        return ($Status.Phase==gaugeEnd);
    }
    function RicercaEnnuple($Livello, $MaxLivello, $Gauge){  // BOOLEAN
        var $MinInd=0;
        var $Ind=0;
        var $Esito=0;
        try{
            /*************************************************************
            * MaxLivello è la cardinalità dell'insieme soluzione cercato *
            * Livello è la profondità della ricorsione raggiunta         *
            *************************************************************/
            $Esito = false;
            if($Livello==$MaxLivello){
                /******************************************
                * Sono all'ultimo stadio della ricorsione *
                ******************************************/
                $MinInd=$Status.LastIndici[$MaxLivello];
                if($MinInd==0){
                    $Ind=TrovaPrimo($Gauge);
                    if($Ind>0){
                        $free=true;
                        for($i=1; $i<=$MaxLivello-1; $i++){
                            if($Status.LastIndici[$i]==$Ind){
                                $free=false;
                            }
                        }
                        if($free){
                            /********************
                            * Trovata soluzione *
                            ********************/
                            $Status.LastIndici[$MaxLivello]=$Ind;
                            $Esito = true;
                        }
                        else{
                            $Status.LastIndici[$MaxLivello]=0;
                        }
                    }
                }
                else{
                    if($MinInd < $Status.MaxValore){
                        $Status.LastIndici[$MaxLivello] = $MinInd + 1;
                        if(Math.abs($Gauge - $Valori[$MinInd + 1].Valore) <= $Status.Tolerance){
                            /********************
                            * Trovata soluzione *
                            ********************/
                            $Esito = true;
                        }
                    }
                    else{
                        $Status.LastIndici[$MaxLivello] = 0;
                    }
                }
            }
            else{
                /************************
                * Eseguo una ricorsione *
                ************************/
                if(($Status.SkipIndex == true) && ($Livello == 1) && ($MaxLivello == 3)){
                    $Esito = false;
                    while( SkipRandom() ){
                        $Esito = RicercaEnnuple($Livello + 1, $MaxLivello, $Gauge - $Valori[$Status.LastIndici[$Livello]].Valore);
                        if($Esito){
                            break;
                        }
                        $Status.LastIndici[$Livello] = 0;
                    }
                }
                else{
                    if($Status.LastIndici[$Livello] == 0){
                        if($Livello == 1)
                            $Status.LastIndici[$Livello] = 1;
                        else
                            $Status.LastIndici[$Livello] = $Status.LastIndici[$Livello - 1] + 1;
                    }
                    for($i=$Status.LastIndici[$Livello]; $i<=$Status.MaxValore; $i++){
                        $Status.LastIndici[$Livello] = $i;
                        $Esito = RicercaEnnuple($Livello + 1, $MaxLivello, $Gauge - $Valori[$i].Valore);
                        if($Esito){
                            break;
                        }
                        $Status.LastIndici[$Livello] = 0;
                    }
                }
                if($Livello <= 2){
                    if(ControllaBreak()){
                        $Esito = true;
                    }
                }
            }
        }
        catch($e){
            $StatusErrNumber = 5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
            $Esito=false;
        }
        return $Esito;
    }
    function RicercaStatistica(){
        var $Esito=0;
        var $Scostamento=0;
        var $Probabilita=0;
        var $ValSel=0;
        try{
            $Esito = false;
            $SommaProb=0;
            $Iterazioni+=1;
            $SubIterazioni+=1;
                
            if($FaseRicerca == 0){
                if($Iterazioni > 1000){
                    $RicercaBipolare = true;
                    $FaseRicerca = 1;
                }
            }
            else if($FaseRicerca == 1){
                if($Iterazioni > 2000){
                    $FaseRicerca = 2;
                }
            }
            else if($FaseRicerca == 2){
                $FaseRicerca = 3;
            }    
            else if($FaseRicerca == 4){
                if($Iterazioni - $IterazioniAlla4 > 1000){
                    $FaseIterazioni = 4;
                    $FaseRicerca = 5;
                }
            }
            if($FaseRicerca < 4){
                if((($Status.MaxValore + DIAMETRO) / DIAMETRO < 0.67) || ($Iterazioni > 10000)){
                    $RicercaBipolare = false;
                    $FaseRicerca = 4;
                    $IterazioniAlla4 = $Iterazioni;
                }
            }
            $ValSel = $Status.Gauge - $TotaleSelez;
            for($i=1; $i<=$Status.MaxValore; $i++){
                if(!$Valori[$i].Selezionato){
                    $Scostamento=Math.abs($ValSel-$Valori[$i].Valore);
                    if(($Scostamento<=$Status.Tolerance)&&($i!=$UltimoTolto)&&($ContaSelez<$Status.MaxSize+5)){
                        $Valori[$i].Selezionato = true;
                        $ContaSelez++;
                        $UltimoAggiunto = $i;
                        $Esito = true;
                        break;
                    }
                    else{
                        if($RicercaBipolare){
                            if($Scostamento > Math.abs($ValSel + $Valori[$i].Valore)){
                                $Scostamento = Math.abs($ValSel + $Valori[$i].Valore);
                            }
                        }
                        if($Scostamento > $Status.Tolerance)
                            $Probabilita = 1 / $Scostamento;
                        else
                            $Probabilita = 0;
                        $Valori[$i].ProbAggiungere = $Probabilita;
                        $SommaProb += $Probabilita;
                    }
                    $Valori[$i].ProbTogliere = 0;
                }
                else{
                    $Scostamento = Math.abs($ValSel + $Valori[$i].Valore);
                    if(($Scostamento <= $Status.Tolerance) && ($i != $UltimoAggiunto) && ($ContaSelez > $Status.MinSize - 5)){
                        if($Valori[$i].Selezionato){
                            $ContaSelez--;
                            $Valori[$i].Selezionato = false;
                        }
                        $UltimoTolto = $i;
                        $Esito = true;
                        break;
                    }
                    else{
                        if($RicercaBipolare){
                            if($Scostamento > Math.abs($ValSel - $Valori[$i].Valore)){
                                $Scostamento = Math.abs($ValSel - $Valori[$i].Valore);
                            }
                        }
                        if($Scostamento > $Status.Tolerance){
                            if($FaseIterazioni == 0)
                                $Probabilita = Math.sqrt(Math.sqrt(1 / $Scostamento));
                            else if($FaseIterazioni == 1)
                                $Probabilita = Math.sqrt(1 / $Scostamento);
                            else if($FaseIterazioni == 2)
                                $Probabilita = 1 / $Scostamento;
                            else if($FaseIterazioni == 3)
                                $Probabilita = Math.pow( (1 / $Scostamento), 2);
                            else
                                $Probabilita = 1 / $Scostamento;
                        }
                        else{
                            $Probabilita = 0;
                        }
                        $Valori[$i].ProbTogliere = $Probabilita;
                        $SommaProb += $Probabilita;
                    }
                    $Valori[$i].ProbAggiungere = 0;
                }
            }
            if($ContaSelez == 0){
                $Esito = false;
            }
            if(!$Esito){
                PostIterazione();
            }
            ControllaBreak();
        }
        catch($e){
            $StatusErrNumber = 5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
            $Esito=false;
        }
        return $Esito;
    }
    function PostIterazione(){
        try{
            $TotaleSelez=0;
            $ContaSelez=0;
            for($i=1; $i<=$Status.MaxValore; $i++){
                if($Valori[$i].ProbAggiungere > 0){
                    if((($Valori[$i].ProbAggiungere / $SommaProb) - Math.random() > 0)){
                        $Valori[$i].Selezionato = true;
                    }
                }
                else if($Valori[$i].ProbTogliere > 0){
                    if((($Valori[$i].ProbTogliere / $SommaProb) - Math.random() > 0)){
                        $Valori[$i].Selezionato = false;
                    }
                }	
                if($Valori[$i].Selezionato){
                    $TotaleSelez = $TotaleSelez + $Valori[$i].Valore;
                    $ContaSelez++;
                }
            }
            /***************************
            * Gestione fase iterazioni *
            ***************************/
            if($FaseIterazioni == 0){
                if($SubIterazioni > SOGLIA_ITERAZIONI){
                    if($SubIterazioni == $Iterazioni){
                        ResettaSelezione();
                    }
                    $FaseIterazioni = 1;
                }
            }
            else if($FaseIterazioni == 1){
                if($SubIterazioni > 2 * SOGLIA_ITERAZIONI){
                    if($SubIterazioni = $Iterazioni){
                        ResettaSelezione();
                    }
                    $FaseIterazioni = 2;
                }
            }
            else if($FaseIterazioni == 2){
                if($SubIterazioni > 3 * SOGLIA_ITERAZIONI){
                    if($SubIterazioni == $Iterazioni){
                        ResettaSelezione();
                    }
                    $FaseIterazioni = 3;
                }
            }
            else if($FaseIterazioni == 3){
                if($SubIterazioni > 4 * SOGLIA_ITERAZIONI){
                    $FaseIterazioni = 0;
                    $SubIterazioni = 0;
                }
            }
        }
        catch($e){
            $StatusErrNumber = 5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
        }
    }
    function GestioneErrore(){
        // IMPOSTO UNA RISPOSTA VUOTA
        $StatusRitorno=[];
        // MI METTO NELLA FASE DI FINE RICERCA PER USCIRE DAL LOOP
        $Status.Phase=gaugeEnd;
        if(window.console){console.log($StatusErrDescription)}
        return false;
    }
    function SkipRandom(){
        try{
            var $Cnt = 0;
            var $Fnd = false;
            $Status.LastIndici[1]=Math.floor( (Math.random()*$Status.MaxValore) )+1;
            while(true){
                if($StatusSkipUsed.indexOf($Status.LastIndici[1])<0){
                    $Fnd=true;
                    break;
                }
                $Status.LastIndici[1]+=1;
                if($Status.LastIndici[1]>$Status.MaxValore){
                    $Status.LastIndici[1]=1;
                }
                $Cnt+=1;
                if($Cnt>$Status.MaxValore){
                    break;
                }
            }
            if($Fnd){
                $StatusSkipUsed.push($Status.LastIndici[1]);
            }
        }
        catch($e){
            $StatusErrNumber = 5;
            $StatusErrDescription=$e.message;
            GestioneErrore();
            $Fnd=false;
        }
        return $Fnd;
    }
    return this;
}
