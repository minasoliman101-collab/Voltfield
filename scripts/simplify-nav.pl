# Groups the 13-item Tools dropdown into three labelled sets.
#
# Thirteen flat links is a list, not a menu: nothing tells a reader whether
# "Part ID" and "Obsolete/EOL" are related, or which does what they came for.
# Three headed groups make it scannable without removing a tool. Search leaves
# the dropdown -- it is not a tool.
#
# Matches the navdrop-menu block structurally rather than by exact text: the
# same nav ships with two href styles (root-relative on the pages one directory
# deep, relative at the root) and three different indentations, so a literal
# match caught only 28 of 321 pages. Indentation and href style are taken from
# the block being replaced so each page keeps its own conventions.
use strict; use warnings;
my $n = 0;
for my $f (@ARGV) {
  open my $in, '<:raw', $f or next; my $s = do { local $/; <$in> }; close $in;
  next unless $s =~ m{(<div class="navdrop-menu">)(.*?)(</div>)}s;
  my ($open, $body, $close) = ($1, $2, $3);
  next unless $body =~ /All Free Tools/;
  # learn this page's conventions from its own markup
  my ($indent) = $body =~ /\n([ \t]+)<a /;  $indent //= '          ';
  my ($pfx)    = $body =~ /<a href="(\/?)free-tools\.html"/; $pfx //= '';
  my @rows = (
    ['a','free-tools.html','All free tools',' class="navdrop-all"'],
    ['g','','Calculate',''],
    ['a','engineering-calculators.html','Engineering calculators',''],
    ['a','voltfield-bom-generator.html','BOM generator',''],
    ['g','','Design &amp; practice',''],
    ['a','voltfield-sandbox.html','One-line sandbox',''],
    ['a','voltfield-pod-designer.html','POD &amp; skid designer',''],
    ['a','voltfield-rack-builder.html','Rack elevation builder',''],
    ['a','voltfield-pcb.html','PCB builder',''],
    ['a','voltfield-pcb-layout.html','PCB layout tool',''],
    ['g','','Look it up',''],
    ['a','voltfield-identify.html','Identify a part',''],
    ['a','voltfield-eol.html','Obsolete &amp; end-of-life',''],
    ['a','rfq-toolkit.html','RFQ readiness checklist',''],
    ['a','voltfield-glossary-quiz.html','Glossary quiz',''],
  );
  my $new = "\n";
  for my $r (@rows) {
    $new .= $r->[0] eq 'g'
      ? qq{$indent<span class="navdrop-grp">$r->[2]</span>\n}
      : qq{$indent<a href="$pfx$r->[1]"$r->[3]>$r->[2]</a>\n};
  }
  $new .= substr($indent, 0, length($indent) - 2);
  $s =~ s{\Q$open$body$close\E}{$open$new$close}s;
  open my $out, '>:raw', $f or next; print $out $s; close $out;
  $n++;
}
print "  dropdown regrouped on $n pages\n";
