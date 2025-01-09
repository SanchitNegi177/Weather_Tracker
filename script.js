import { config } from './config.js';

let chart; // Declare a variable to hold the chart instance
let weatherData; // Declare a variable to store the fetched weather data
let currentUnit = 'C'; // Track the current temperature unit
let selectedDayIndex = 0; // Track the selected day index

function fetchWeatherData(location) {
    const apiUrl = `${config.URL}forecast.json?q=${encodeURIComponent(location)}&days=7&aqi=yes`;
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
        displayGraph(data.forecast.forecastday, 'temperature', selectedDayIndex);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error fetching weather data. Please try again.');
    });
}

function displayWeather(data, dayIndex) {
    const location = data.location;
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
        <div class="high-low">High : ${currentUnit === 'C' ? current.maxtemp_c : current.maxtemp_f}°  &nbsp  | &nbsp Low : ${currentUnit === 'C' ? current.mintemp_c : current.mintemp_f}°</div>
        <div class="details">
            <div class="detail"><span>Humidity :</span><span>${current.avghumidity}%</span></div>
            <div class="detail"><span>Precipitation Chances :</span><span>${current.daily_chance_of_rain}%</span></div>
            <div class="detail"><span>Wind :</span><span>${current.maxwind_kph} KpH</span></div>
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

function displayGraph(forecast, type, dayIndex) {
    const ctx = document.getElementById('weatherGraph').getContext('2d');
    const labels = forecast[dayIndex].hour.map(hour => new Date(hour.time).getHours() + ':00');
    const data = forecast[dayIndex].hour.map(hour => {
        switch (type) {
            case 'temperature':
                return currentUnit === 'C' ? hour.temp_c : hour.temp_f;
            case 'precipitation':
                return hour.precip_mm;
            case 'wind':
                return hour.wind_kph;
            default:
                return hour.temp_c;
        }
    });

    if (chart) {
        chart.destroy(); // Destroy the previous chart instance
    }

    chart = new Chart(ctx, {
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
                    display: false // Hide the legend
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
                    }
                }
            }
        }
    });
}

document.getElementById('getWeatherBtn').addEventListener('click', function() {
    const cityName = document.getElementById('locationInput').value;
    if (cityName) {
        fetchWeatherData(cityName);
    } else {
        alert('Please enter a city name');
    }
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const type = this.dataset.type;
        if (weatherData) {
            displayGraph(weatherData.forecast.forecastday, type, selectedDayIndex);
        }
    });
});

document.getElementById('weatherInfo').addEventListener('click', function(e) {
    if (e.target.classList.contains('unit')) {
        currentUnit = e.target.dataset.unit;
        displayWeather(weatherData, selectedDayIndex);
        displayGraph(weatherData.forecast.forecastday, 'temperature', selectedDayIndex);
    }
});

document.getElementById('forecast').addEventListener('click', function(e) {
    if (e.target.closest('.forecast-day')) {
        selectedDayIndex = e.target.closest('.forecast-day').dataset.index;
        displayWeather(weatherData, selectedDayIndex);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-type="temperature"]').classList.add('active');
        displayGraph(weatherData.forecast.forecastday, 'temperature', selectedDayIndex);
    }
});

