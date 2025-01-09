import { config } from './config.js';

let weatherData; // Store the fetched weather data
let currentUnit = 'C'; // Default temperature unit
let selectedDayIndex = 0; // Track the selected day index
let charts = []; // Array to hold chart instances

function fetchWeatherData(location) {
    const apiUrl = `${config.URL}forecast.json?q=${encodeURIComponent(location)}&days=7`;
    const apiKey = config.API_KEY; 

    fetch(apiUrl, {
        headers: {
            'key': apiKey
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error fetching data');
        }
        return response.json();
    })
    .then(data => {
        weatherData = data; // Store the fetched data
        displayWeather(data, selectedDayIndex); // Display today's weather by default
        displayAllGraphs(data.forecast.forecastday, selectedDayIndex);
        setVisibility(true);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error fetching weather data. Please try again.');
    });
}

function displayWeather(data, dayIndex) {
    const location = data.location;
    const astro = data.forecast.forecastday[dayIndex].astro;
    const current = data.forecast.forecastday[dayIndex].day;
    const forecast = data.forecast.forecastday;

    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `
        <h2>${location.name}, ${location.region}</h2>
        <p>${current.condition.text} • ${new Date(forecast[dayIndex].date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        <div class="temperature">
            <img src="${current.condition.icon}" alt="${current.condition.text}">
            <span class="temp">${currentUnit === 'C' ? current.avgtemp_c : current.avgtemp_f}°</span>
            <div class="units">
                <span class="unit ${currentUnit === 'C' ? 'active' : ''}" data-unit="C">C</span>
                <span class="unit ${currentUnit === 'F' ? 'active' : ''}" data-unit="F">F</span>
            </div>
        </div>
        <div class="high-low">High: ${currentUnit === 'C' ? current.maxtemp_c : current.maxtemp_f}° | Low: ${currentUnit === 'C' ? current.mintemp_c : current.mintemp_f}°</div>
        <div class="details">
            <div class="detail"><span>Humidity:</span><span>${current.avghumidity}%</span></div>
            <div class="detail"><span>Precipitation Chances:</span><span>${current.daily_chance_of_rain}%</span></div>
            <div class="detail"><span>Wind:</span><span>${current.maxwind_kph} KpH</span></div>
        </div>
        <div class="additional-details">
            <h3>Additional Details</h3>
            <div class="detail"><span>Sunrise:</span><span>${astro.sunrise}</span></div>
            <div class="detail"><span>Sunset:</span><span>${astro.sunset}</span></div>
            <div class="detail"><span>Moonrise:</span><span>${astro.moonrise}</span></div>
            <div class="detail"><span>Moonset:</span><span>${astro.moonset}</span></div>
            <div class="detail"><span>Moon Phase:</span><span>${astro.moon_phase}</span></div>
            <div class="detail"><span>Moon Illumination:</span><span>${astro.moon_illumination}%</span></div>
            <div class="detail"><span>Chance of Rain:</span><span>${current.daily_chance_of_rain}%</span></div>
            <div class="detail"><span>Will it Rain:</span><span>${current.daily_will_it_rain ? 'Yes' : 'No'}</span></div>
            <div class="detail"><span>Chance of Snow:</span><span>${current.daily_chance_of_snow}%</span></div>
            <div class="detail"><span>Will it Snow:</span><span>${current.daily_will_it_snow ? 'Yes' : 'No'}</span></div>
        </div>
    `;

    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = forecast.map((day, index) => `
        <div class="forecast-day ${index == dayIndex ? 'active' : ''}" data-index="${index}">
            <p>${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <img src="${day.day.condition.icon}" alt="${day.day.condition.text}">
            <p>${currentUnit === 'C' ? day.day.maxtemp_c : day.day.maxtemp_f}° ${currentUnit === 'C' ? day.day.mintemp_c : day.day.mintemp_f}°</p>
        </div>
    `).join('');
}

function displayAllGraphs(forecast, dayIndex) {
    const types = ['temperature', 'precipitation', 'wind'];
    const units = {
        temperature: currentUnit === 'C' ? '°C' : '°F',
        precipitation: 'mm',
        wind: 'kph'
    };

    // Destroy existing charts
    charts.forEach(chart => chart.destroy());
    charts = []; // Clear the array

    types.forEach((type, index) => {
        const ctx = document.getElementById(`weatherGraph${index}`).getContext('2d');
        const labels = forecast[dayIndex].hour.map(hour => new Date(hour.time).getHours() + ':00');
        const data = forecast[dayIndex].hour.map(hour => {
            switch (type) {
                case 'temperature':
                    return currentUnit === 'C' ? hour.temp_c : hour.temp_f;
                case 'precipitation':
                    return hour.precip_mm;
                case 'wind':
                    return hour.wind_kph;
            }
        });

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    data: data,
                    borderColor: '#2196F3',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: type.charAt(0).toUpperCase() + type.slice(1)
                        },
                        ticks: {
                            callback: function(value) {
                                return value + ' ' + units[type];
                            }
                        }
                    }
                }
            }
        });

        charts.push(chart); // Store the chart instance
    });
}

function setVisibility(visible) {
    const visibility = visible ? 'visible' : 'hidden';
    document.querySelector('.content').style.visibility = visibility;
    document.getElementById('forecast').style.visibility = visibility;
}

// Event listener for fetching weather data
document.getElementById('getWeatherBtn').addEventListener('click', function() {
    const cityName = document.getElementById('locationInput').value;
    if (cityName) {
        fetchWeatherData(cityName);
    } else {
        alert('Please enter a city name');
    }
});

// Event listener for unit switching
document.getElementById('weatherInfo').addEventListener('click', function(e) {
    if (e.target.classList.contains('unit')) {
        currentUnit = e.target.dataset.unit;
        displayWeather(weatherData, selectedDayIndex);
        displayAllGraphs(weatherData.forecast.forecastday, selectedDayIndex);
    }
});

// Event listener for changing the selected day
document.getElementById('forecast').addEventListener('click', function(e) {
    if (e.target.closest('.forecast-day')) {
        selectedDayIndex = e.target.closest('.forecast-day').dataset.index;
        displayWeather(weatherData, selectedDayIndex);
        displayAllGraphs(weatherData.forecast.forecastday, selectedDayIndex);
    }
});
