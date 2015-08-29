<?php

class newsController extends baseController{

	const SPORT_URL_FEED = "http://www.sport.es/es/rss/last_news/rss.xml";
	const MUYCOMPUTER_URL_FEED = "http://www.muycomputer.com/feed/";
	const GENERAL_NEWS = "http://www.larazon.es/rss/portada.xml";

	private function getFeed($type){
		
		$content = @file_get_contents($type);
		if (isset($http_response_header) && strpos($http_response_header[0],'200')){
			$content = simplexml_load_string($content);
		}else{
			throw new Exception(error_get_last()["message"]);
		}
		return $content;
	}

	private function documentProcessing($feed){
		$news = array();
		foreach($feed->channel->item as $new){
			//extraemos la imagen de la descripción
			$doc = new DOMDocument();
			@$doc->loadHTML($new->description);
 			//Obtenemos el SRC.
			$images = $doc->getElementsByTagName('img');
			foreach ($images as $image) {

			    $alt   = $image->getAttribute('alt');
			    $src   = $image->getAttribute('src');
			    $title = $image->getAttribute('title');
			}

		    array_push($news,array(
		    	"poster" => $src,
		    	"title" => $new->title,
		    	"link" => $new->link,
		    	"date" => $new->pubDate,
		    	"desc" => $new->description
		    ));
		}

		return $news;
	}

	public function getLatestSportsNews(){

		
		//cargamos el feed rss
		try {
			$feedSport = $this->getFeed(self::SPORT_URL_FEED);
			$news = $this->documentProcessing($feedSport);

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


	public function getLatestTechnologyNews(){

		$feedTech = $this->getFeed(self::MUYCOMPUTER_URL_FEED);
		$news = $this->documentProcessing($feedTech);
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

	public function getGeneralNewsToday(){
		$feedGeneralNews = $this->getFeed(self::GENERAL_NEWS);
		$news = $this->documentProcessing($feedGeneralNews);
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
}