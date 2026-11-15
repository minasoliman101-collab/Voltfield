#!/usr/bin/perl
# Nov 2026 repositioning, applied to every page:
#   - Tools menu gains "Drawings" (after Formulas)
#   - footer Sectors list gains "Power Generation & Grid"
#   - footer blurb no longer says the site is only data centers, solar and storage
#   find . -name '*.html' -not -path './vendor/*' -print0 | xargs -0 perl -i scripts/reposition-nov-2026.pl
# Idempotent. Each inserted link copies the href prefix of the line it follows.
use strict; use warnings;
binmode(STDIN); binmode(STDOUT);
$/ = undef;
while (my $s = <>) {
  unless ($s =~ m{<b>Drawings</b><em>}) {
    $s =~ s{^([ \t]*)<a href="([^"]*)formulas\.html"><b>Formulas</b><em>[^<]*</em></a>(\r?\n)}
           {$&$1<a href="$2drawings.html"><b>Drawings</b><em>Typical single-line diagrams and symbols</em></a>$3}m;
  }
  unless ($s =~ m{power-generation\.html">Power Generation &amp; Grid</a>}) {
    $s =~ s{^([ \t]*)<li><a href="([^"]*)battery-storage\.html">Storage Systems</a></li>(\r?\n)}
           {$&$1<li><a href="$2power-generation.html">Power Generation &amp; Grid</a></li>$3}m;
  }
  $s =~ s{An independent engineering reference for electrical power and cooling equipment in data centers, solar and battery storage\.}
         {An independent reference for power generation, data center and energy storage projects, for the people who specify, buy and ship the equipment.}g;
  print $s;
}
