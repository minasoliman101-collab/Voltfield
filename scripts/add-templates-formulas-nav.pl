#!/usr/bin/perl
# Adds "Templates" and "Formulas" to the Tools menu on every page.
#   find . -name '*.html' -not -path './vendor/*' -print0 | xargs -0 perl -i scripts/add-templates-formulas-nav.pl
# Idempotent: a page that already has the links is left alone. The new link
# copies the href prefix ("/", "", "../") of the line it follows.
use strict; use warnings;
binmode(STDIN); binmode(STDOUT);
$/ = undef;
while (my $s = <>) {
  unless ($s =~ m{<b>Templates</b><em>}) {
    $s =~ s{^([ \t]*)<a href="([^"]*)specification-checklist\.html"><b>Specification checklist</b><em>[^<]*</em></a>(\r?\n)}
           {$&$1<a href="$2templates.html"><b>Templates</b><em>Purchase order, bill of lading, proof of delivery</em></a>$3}m;
  }
  unless ($s =~ m{<b>Formulas</b><em>}) {
    $s =~ s{^([ \t]*)<a href="([^"]*)voltfield-identify\.html"><b>Identify a part</b><em>[^<]*</em></a>(\r?\n)}
           {$1<a href="$2formulas.html"><b>Formulas</b><em>Power, generation, storage and cooling</em></a>$3$&}m;
  }
  print $s;
}
