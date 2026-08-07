const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const components = [
    'ObservationDetail',
    'AdminView',
    'WeatherCard'
];

components.forEach(comp => {
    const findStr = \`function \${comp}({\`;
    if (code.includes(findStr)) {
        code = code.replace(findStr, \`const \${comp} = React.memo(function \${comp}({\`);
        // We need to find the end of the function.
        // It usually ends with "\n}" before the next function or component.
        // Actually this is risky to parse with regex.
    }
});
