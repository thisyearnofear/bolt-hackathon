import { useEffect, useState, useCallback } from 'react'
import { ABlock } from './lib/ABlock'
import { ContestantInfo } from './components/ContestantInfo'
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";

import './App.css'
import { Demo } from './Demo';
import ThreeCanvas from './components/threeCanvas';

function App() {

	const [isDemoReady, setIsDemoReady] = useState(false);
	const [isDarkTheme, setIsDarkTheme] = useState(false);
	const [isGPUAvailable, setIsGPUAvailable] = useState(WebGPU.isAvailable());
	const [selectedBlock, setSelectedBlock] = useState<ABlock>();


	useEffect(() => {

		document.body.classList.add('loading');

		const interval = setInterval(() => {
			if (Demo.instance != null && Demo.firstRenderDone) {
				setIsDemoReady(true);
				clearInterval(interval);
				document.body.classList.remove('loading');
			}
		}, 100);
	}, []);



	const toggleTheme = () => {
		setIsDarkTheme(prevTheme => !prevTheme);
		document.documentElement.setAttribute('data-theme', isDarkTheme ? 'light' : 'dark');

		Demo.setTheme(isDarkTheme ? 'light' : 'dark');

	};

	return (
		<>
			<header className="frame">
				<h1 className="frame__title">The World's Largest Hackathon</h1>
				<div className="frame__info">
					<span>🌐 Virtual Event</span>
					<span>🏆 $1M+ in Prizes</span>
					<span>📅 TBD</span>
				</div>
				<nav className="frame__tags">
					<a href="#" onClick={(e) => {
						e.preventDefault();
						Demo.instance?.setActiveCategory(null);
					}}>#all</a>
					<a href="#" onClick={(e) => {
						e.preventDefault();
						Demo.instance?.setActiveCategory('prize');
					}}>#prizes</a>
					<a href="#" onClick={(e) => {
						e.preventDefault();
						Demo.instance?.setActiveCategory('sponsor');
					}}>#sponsors</a>
					<a href="#" onClick={(e) => {
						e.preventDefault();
						Demo.instance?.setActiveCategory('judge');
					}}>#judges</a>
					<a href="http://hackathon.dev" target="_blank">#register</a>
				</nav>
			</header>

			<div className="content">
				{!isGPUAvailable && (
					<div className='demo__infos__container'>
						<div className='demo__infos'>
							<h1 className="frame__title">WebGPU not available</h1>
							<p>WebGPU is not available on your device or browser. Please use a device or browser that supports WebGPU.</p>
						</div>
					</div>
				)}
				{!isDemoReady && (
					<div className="loader-container">
						<span className="loader"></span>
					</div>
				)}
				<button 
					className='theme-toggle-button' 
					onClick={toggleTheme}
					aria-label={`Switch to ${!isDarkTheme ? 'dark' : 'light'} mode`}
				>
					{isDarkTheme ? '☀️' : '🌙'}
				</button>
				<ThreeCanvas onBlockClick={setSelectedBlock} />
				<ContestantInfo block={selectedBlock} />

			</div>



		</>
	)
}

export default App
