const fs = require('fs');
let html = fs.readFileSync('stitch_generated.html', 'utf8');

// Extract main content
const mainStart = html.indexOf('<nav');
const mainEnd = html.indexOf('</body>');
let content = html.substring(mainStart, mainEnd);

// Replace class with className
content = content.replace(/class=/g, 'className=');

// Replace style strings
content = content.replace(/style="([^"]+)"/g, (match, p1) => {
    if (p1 === "font-variation-settings: 'FILL' 1;") {
        return "style={{ fontVariationSettings: \"'FILL' 1\" }}";
    }
    return match;
});

// Image replacements
content = content.replace(/src="https:\/\/lh3\.googleusercontent\.com\/aida-public\/([^"]+)"/g, (match, id) => {
    if (id === 'AB6AXuDsjUqM0k_uRa7h9bdNwiCJpqLcu6MVNHGsVUEoHvAGD0xMXi2UQlByQN_dq9c6vZ5FlzTbpYrEe79cVzC0n0n6DEMsFkbYirDLgwWf3_BD4xImS_LoV_qneqVT1fDzOEIEQs04aRM8Sbf78hN7gvq0E2HGUx9YskxJ-1M8cjqhBGtgYxjzyz5GXB_I7o8J0JeZbGvTBux4up36u_88FF5oeNGzafVwaBTbKEtsC2uWA6Uh1hhAR5ej3JfJC4ng2sanzEyLt8cOX26w') return 'src="/hero.png"';
    if (id === 'AB6AXuByFDw6-cwjOHBivV-OFzQ34ypob-EWBhmMj0LANDFWApj_JAjkiCpGD3xfC7c3L1dNKpENfaZFaMFuqU9_2LoeMhFnUvO6o8a66yr8JCYpzQJj3idYhCacuE6VLbj4TW5Yh2H7pF03hM3n6pbGsb_sFOLt5OQ3YW2bHki31t_Chdt0hCNJmIezCpn3sMrszYXHeaGCIHYKGZ5ynZ6YMp3bXmEJJ2ndlncMCF8ZWImDQmsSgOlbJOGsqCu1d4EUkMFBDdwTz_ktZcSc') return 'src="/hero.png"';
    if (id === 'AB6AXuAD-lVxrhQ0HKUccrb8hKy-ILhoKJBRdyytcNeq50m-Jjrs8jy-q6rNbVzyAyTBbZ2gI5esfU6JS-smdEVQH2wxUlNoMPlEoxb2vTC2q8X6WML27X7UVwLRnlsz5atAdT68yG8sBoX_IhOOivqYNDPhkHrWPFY-oyYfikTDhNYeSc4D9GIQfOPzGGoGCYvpswUQAi0G7hCDp4CyIYrM6b43mHFwSSfvLoNzgs0Keeoxdc69xUkSFJ0UqLdbZURUo_x6hhGhogj8fKGR') return 'src="/blulagoonbox.png"';
    if (id === 'AB6AXuDF_CjB91oSDtMLz7Nr_Bu2nrq7HN8CN2WJkZrOQuk3UNxGaitUwnuREuUjZ4cS8EQtf5sUs_OBitO2LoeAZnEoqukVWcl3oSYbKJlawcvPiXLcjPycV8TK2xFQCSDMzMTUUAkQM6LwZZZd4d6zu5lbpSdrm22PKUuRhMptTowC0fxxGZ8m-tAzDNlzrQvhhPHS8m75XR25Y8Z-roGs0fzX92EgGRWLIaNBs_VgP1j6eim0zGhIml2ZBAg92maQ0AphD8rm46uc8XnM') return 'src="/greentangbox.png"';
    if (id === 'AB6AXuAuO_AV7LOFIEX2HOJC6imbtSufLE9A5nWC_8AREqQL_qroZ6zpeSIpoY5b4S5IsIrgWb7vUK2bsFF4nTz6N9afmDLsZ161_mgi9AmzGjavYj060XR2PJl_XSkg6g7eIQEZBLfnVHLJtbEOXUKNeB1EMDs7NnjUd_NbknCaacWwX5SNEuL3Msv1eBdW9FNfVtNOy8cPmS5yTgZG1lOAYYS0Kh6-ZXQWn8UyZZ_ZDjjIgNdK9C4ev3NlDW94Ko9GH0c4A2YVSo9cRW0B') return 'src="/orangetangbox.png"';
    if (id === 'AB6AXuC_6ouAFEuUwWivf2EY0gp2_CKQeSHlC7M8_FzvAr-s4fDNIkd9r2lo_LA-GOTOWE5Y4NHXWcMG_31MT1LKZK5K4Wbu4Spj4lFMVKbL_0sVBc_SwhyYZRAU5H-jROvPPNNuWILfb1P_VrMGIWagGAese_w5_lC9rGeaqZvO_s4NGXUf-CDehTScNb_QzoQWdgw8g7b2WIXBHPKfWfSSIkYwhQnu7PpCylcFv754_rNdMDrB4tDbAjkRlSsJSMbwbX6Jdki_2JXrDW_2') return 'src="/virginmojitobox.png"';
    return match;
});

// Self-closing input and br and img
content = content.replace(/<input([^>]+)>/g, (m) => m.endsWith("/>") ? m : m.replace(/>$/, "/>"));
content = content.replace(/<img([^>]+)>/g, (m) => m.endsWith("/>") ? m : m.replace(/>$/, "/>"));
content = content.replace(/<br>/g, '<br/>');

const pageTsx = `import React from 'react';

export default function Home() {
  return (
    <>
      ${content}
    </>
  );
}
`;

fs.writeFileSync('app/page.tsx', pageTsx);
console.log('Successfully written to app/page.tsx');
