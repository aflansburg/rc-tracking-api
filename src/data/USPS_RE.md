^a shipping label has been prepared.*at (\d+:\d\d.*) in ((?:\w+,|\w+ \w+) \w+ \d+)|your item departed our (\w+,|\w+ \w+).*on (\w+ \d+, \d+) at (\d+:\d\d\s\w+)|your item arrived at our\D+in (\w+, \w+|\w+ \w+).*on (\w+ \d+, \d+) at (\d+:\d\d\s\w+)|your item was delivered.*(\d+:\d\d\s\w+) on (\w+ \d+, \d+) in (\w+,\s\w+\s\d+|\w+ \s\w+\s\d+)|Your item is out for del.* on (\w+\s\d+,\s\d+) at (\d+:\d+\s\w+) in (\w+,\s\w+\s\d+|\w\s\w+\s\d+)|usps was unable to deliver.*of (\d+:\d\d\s\w+) on (\w+ \d+, \d+) in (\w+,\s\w+\s\d+|\w+ \s\w+\s\d+). (.*)|we attempted.*at (\d+:\d\d\s\w+) on (\w+ \d+, \d+) in (\w+,\s\w+\s\d+|\w+ \s\w+\s\d+) (?:and|or|but|however) (.*).|The item is currently in transit to the next facility.*f (\w+\s\d+,\s\d+)

Match 1
Full match  0-98  `A shipping label has been prepared for your item at 11:38 am on June 28, 2018 in NEWBERN, TN 38059`
Group 1.  52-77 `11:38 am on June 28, 2018`
Group 2.  81-98 `NEWBERN, TN 38059`
Match 2
Full match  172-275 `Your item departed our MEMPHIS TN DISTRIBUTION CENTER ANNEX origin facility on June 28, 2018 at 1:05 am`
Group 3.  195-205 `MEMPHIS TN`
Group 4.  251-264 `June 28, 2018`
Group 5.  268-275 `1:05 am`
Match 3
Full match  331-437 `Your item arrived at our USPS facility in MOBILE AL DISTRIBUTION CENTER ANNEX on June 28, 2018 at 12:57 pm`
Group 6.  373-382 `MOBILE AL`
Group 7.  412-425 `June 28, 2018`
Group 8.  429-437 `12:57 pm`
Match 4
Full match  493-588 `Your item was delivered in or at the mailbox at 2:41 pm on June 28, 2018 in ARLINGTON, TN 38002`
Group 9.  541-548 `2:41 pm`
Group 10. 552-565 `June 28, 2018`
Group 11. 569-588 `ARLINGTON, TN 38002`
Match 5
Full match  591-668 `Your item is out for delivery on June 28, 2018 at 8:37 am in LAREDO, TX 78045`
Group 12. 624-637 `June 28, 2018`
Group 13. 641-648 `8:37 am`
Group 14. 652-668 `LAREDO, TX 78045`
Match 6
Full match  671-774 `Your item was delivered at the front door or porch at 2:49 pm on June 28, 2018 in GAINESVILLE, FL 32607`
Group 9.  725-732 `2:49 pm`
Group 10. 736-749 `June 28, 2018`
Group 11. 753-774 `GAINESVILLE, FL 32607`
Match 7
Full match  777-921 `USPS was unable to deliver your item as of 8:02 am on June 28, 2018 in ELBURN, IL 60119. The address may be incorrect, incomplete, or illegible.`
Group 15. 820-827 `8:02 am`
Group 16. 831-844 `June 28, 2018`
Group 17. 848-864 `ELBURN, IL 60119`
Group 18. 866-921 `The address may be incorrect, incomplete, or illegible.`
Match 8
Full match  923-1085  `We attempted to deliver your item at 8:22 am on June 28, 2018 in CANTON, NC 28716 and a notice was left because the receptacle was full or the item was oversized.`
Group 19. 960-967 `8:22 am`
Group 20. 971-984 `June 28, 2018`
Group 21. 988-1004  `CANTON, NC 28716`
Group 22. 1009-1084 `a notice was left because the receptacle was full or the item was oversized`
Match 9
Full match  1087-1160 `The item is currently in transit to the next facility as of June 28, 2018`
Group 23. 1147-1160 `June 28, 2018`

#SAMPLE STRINGS:
A shipping label has been prepared for your item at 11:38 am on June 28, 2018 in NEWBERN, TN 38059. This does not indicate receipt by the USPS or the actual mailing date.
Your item departed our MEMPHIS TN DISTRIBUTION CENTER ANNEX origin facility on June 28, 2018 at 1:05 am. The item is currently in transit to the destination.
Your item arrived at our USPS facility in MOBILE AL DISTRIBUTION CENTER ANNEX on June 28, 2018 at 12:57 pm. The item is currently in transit to the destination.
Your item was delivered in or at the mailbox at 2:41 pm on June 28, 2018 in ARLINGTON, TN 38002.
Your item is out for delivery on June 28, 2018 at 8:37 am in LAREDO, TX 78045.
Your item was delivered at the front door or porch at 2:49 pm on June 28, 2018 in GAINESVILLE, FL 32607.
USPS was unable to deliver your item as of 8:02 am on June 28, 2018 in ELBURN, IL 60119. The address may be incorrect, incomplete, or illegible.
We attempted to deliver your item at 8:22 am on June 28, 2018 in CANTON, NC 28716 and a notice was left because the receptacle was full or the item was oversized.