<?php

class newsController extends baseController{

	const SPORT_URL_FEED = "http://www.sport.es/es/rss/last_news/rss.xml";
	const MUYCOMPUTER_URL_FEED = "http://www.muycomputer.com/feed/";
	const GENERAL_NEWS = "http://www.larazon.es/rss/portada.xml";
	const VIDEOGAMES_FEED = "http://www.meristation.com/rss/news/";

	private function getFeed($type){
		
		$content = @file_get_contents($type);
		if (isset($http_response_header) && strpos($http_response_header[0],'200')){
			$content = simplexml_load_string($content);
		}else{
			throw new Exception(error_get_last()["message"]);
		}
		return $content;
	}

	private function documentProcessing($feed,$count,$date){
		$news = array();
		$idx = 0;
		foreach($feed->channel->item as $new){
			
			if ($idx < $count) {

				$pubDate = new DateTime($new->pubDate);
				if ($date && $pubDate->getTimestamp() <= $date) {
					continue;
				}
				
				$doc = new DOMDocument();	
				@$doc->loadHTML($new->description);
				//Obtenemos las imágenes contenidas en las descripción.
				$images = $doc->getElementsByTagName('img');
				if ($images->length > 0) {
					$poster = array();
					foreach ($images as $image) {
						$alt = $image->getAttribute('alt');
						$src = $image->getAttribute('src');
						$title = $image->getAttribute('title');
						array_push($poster, array(
							"alt" => $alt,
							"src" => $src,
							"title" => $title
						));
					}

					array_push($news,array(
						"posters" => $poster,
						"title" => $new->title,
						"link" => $new->link,
						"date" => $pubDate->getTimestamp(),
						"desc" => $new->description
					));

					$idx++;

				}

			}else{
				break;
			}

		}

		return $news;
	}

	public function getLatestSportsNews($count,$date){
		echo "fecha : $date" . PHP_EOL;
		//cargamos el feed rss
		try {
			$feedSport = $this->getFeed(self::SPORT_URL_FEED);
			$news = $this->documentProcessing($feedSport,$count,$date);

			return array(
	            "response_message" => array(
	            	"type" => "RESPONSE",
	            	"name" => "SPORTS_NEWS_OBTAINED",
	            	"data" => array(
	            		"error" => false,
	            		"msg" => $news
	            	)
	            )
	       	);
		} catch (Exception $e) {
			echo $e->message;
		}
		

		
	}


	public function getLatestTechnologyNews($count,$date){

		$feedTech = $this->getFeed(self::MUYCOMPUTER_URL_FEED);
		$news = $this->documentProcessing($feedTech,$count,$date);
		return array(
            "response_message" => array(
            	"type" => "RESPONSE",
            	"name" => "TECHNOLOGY_NEWS_OBTAINED",
            	"data" => array(
            		"error" => false,
            		"msg" => $news
            	)
            )
       	);
	}

	public function getGeneralNewsToday($count,$date){
		$feedGeneralNews = $this->getFeed(self::GENERAL_NEWS);
		$news = $this->documentProcessing($feedGeneralNews,$count,$date);
		return array(
            "response_message" => array(
            	"type" => "RESPONSE",
            	"name" => "GENERAL_NEWS_OBTAINED",
            	"data" => array(
            		"error" => false,
            		"msg" => $news
            	)
            )
       	);
	}

	public function getLatestVideoGamesNews($count,$date){
		$feedGames = $this->getFeed(self::VIDEOGAMES_FEED);
		$news = $this->documentProcessing($feedGames,$count,$date);
		return array(
            "response_message" => array(
            	"type" => "RESPONSE",
            	"name" => "VIDEOGAMES_NEWS_OBTAINED",
            	"data" => array(
            		"error" => false,
            		"msg" => $news
            	)
            )
       	);
	} 
}