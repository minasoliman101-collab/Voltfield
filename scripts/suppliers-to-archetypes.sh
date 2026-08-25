#!/usr/bin/env bash
# Replaces 25 invented company names with the archetypes they actually describe.
#
# voltfield-suppliers.html listed 51 companies. 26 are real and verifiable
# (Grainger, Uline, Graybar, MSC and the 22 OEMs). The other 25 were regional
# US firms with specific HQ cities, lead times and standards -- presented as
# fact, and emitted as "@type":"Organization" in JSON-LD alongside the real
# ones. Searches for the two most checkable ("Meridian Transformer Works,
# Columbus OH", "Cascade Switchgear Systems, Phoenix AZ") return no trace of
# either; both cities have real transformer/switchgear makers, none by these
# names.
#
# A footer note did say the regional profiles were "a modeled sourcing network
# for demonstration", but structured data has no illustrative qualifier: Google
# ingested all 51 as claimed real organizations regardless of the prose.
#
# The market knowledge in those profiles is real and worth keeping -- a
# transformer maker constrained by grain-oriented electrical steel at 120-160
# weeks is an accurate description of that supplier archetype. So the profiles
# stay and the invented identities go: each is renamed to what it is, the fake
# HQ city becomes a region, and all 25 are removed from the Organization list.
set -euo pipefail
f=voltfield-suppliers.html
miss=0
sub() {
  local old=$1 new=$2
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  ${old:0:66}"; miss=$((miss+1)); return 0; fi
  awk -v o="$old" -v n="$new" '{while((i=index($0,o))>0){$0=substr($0,1,i-1) n substr($0,i+length(o))}print}' "$f" > "$f.t" && mv "$f.t" "$f"
}
# name + region + archetype flag, in one edit per entry
arch() { # oldName  newName  oldRegion  newRegion
  sub "n:'$1',"  "n:'$2',arch:1,"
  sub "r:'$3',"  "r:'$4',"
  printf "  %-30s -> %s\n" "$1" "$2"
}

echo "== renaming 25 invented firms to archetypes =="
arch 'Meridian Transformer Works' 'Regional power transformer manufacturer' 'Columbus, OH'          'Midwest US'
arch 'Cascade Switchgear Systems'  'Independent switchgear builder'         'Phoenix, AZ'           'Southwest US'
arch 'Anvil Power Systems'         'Genset packager &amp; integrator'       'Houston, TX'           'Gulf Coast US'
arch 'ColdLoop Thermal'            'Liquid cooling / CDU manufacturer'      'Austin, TX'            'South Central US'
arch 'BusRail Distribution'        'Busway &amp; bus duct manufacturer'     'Columbus, OH'          'Midwest US'
arch 'Helios Module Co.'           'PV module manufacturer'                 'Import + Phoenix, AZ'  'Import + US assembly'
arch 'AmpereVolt Inverters'        'Utility-scale inverter / PCS manufacturer' 'Phoenix, AZ'        'Southwest US'
arch 'SunTrack Structures'         'Tracker &amp; structural BOS manufacturer' 'Albuquerque, NM'    'Southwest US'
arch 'GridKnit Cable'              'MV cable manufacturer'                  'Houston, TX'           'Gulf Coast US'
arch 'IronCell Storage'            'BESS integrator'                        'Dallas, TX'            'South Central US'
arch 'SentinelFire Safety'         'BESS fire suppression manufacturer'     'Columbus, OH'          'Midwest US'
arch 'ThermaCore Skids'            'Thermal management skid builder'        'Austin, TX'            'South Central US'
arch 'Fairline Tubular Mill'       'OCTG tubular mill'                      'Birmingham, AL'        'Southeast US'
arch 'DrillEdge Pipe &amp; Tool'   'Drill pipe &amp; downhole tool manufacturer' 'Midland, TX'      'Permian Basin US'
arch 'WellGuard Pressure Control'  'Pressure control &amp; BOP manufacturer' 'Houston, TX'          'Gulf Coast US'
arch 'Rampart Valve &amp; Flange'  'Valve &amp; flange manufacturer'        'Houston, TX'           'Gulf Coast US'
arch 'LiftPro Artificial Lift'     'Artificial lift manufacturer'           'Odessa, TX'            'Permian Basin US'
arch 'Cordova Recert Services'     'Recertification &amp; rebuild shop'     'Odessa, TX'            'Permian Basin US'
arch 'Titan Fastener Supply'       'Regional fastener distributor'          'Houston, TX'           'Gulf Coast US'
arch 'Foundry Metals Direct'       'Raw stock mill &amp; service center'    'Cleveland, OH'         'Midwest US'
arch 'GuardWell PPE'               'Safety &amp; PPE distributor'           'National · Columbus, OH' 'Regional US'
arch 'MotorWorks Industrial'       'Motor manufacturer &amp; rewind shop'   'Columbus, OH'          'Midwest US'
arch 'FlowPath Fluid Power'        'Fluid power distributor'                'Houston, TX'           'Gulf Coast US'
arch 'BrightArc Electrical'        'Regional electrical distributor'        'National · Phoenix, AZ' 'Southwest US'
arch 'ToolForge Supply'            'Cutting tool &amp; metalworking distributor' 'National · Columbus, OH' 'Midwest US'
echo "  misses: $miss"
