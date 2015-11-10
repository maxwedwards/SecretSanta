(ns secret-santa-web.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [compojure.handler :refer [site]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.adapter.jetty :as jetty]
            [environ.core :refer [env]]))

(defroutes app-routes
  (GET "/" [] "Hello World")
  (route/not-found "Not Found"))

(def app
  (wrap-defaults app-routes site-defaults))

(defn -main [& [port]]
    (let [port (Integer. (or port (env :port) 5000))]
          (jetty/run-jetty (site #'app) {:port port :join? false})))
